import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { app } from 'electron';
import type { DriveItem, DriveFolder, FilterOptions } from '../../src/types/drive';

const esmRequire = createRequire(import.meta.url);

export class DbService {
  private db: any = null;
  private dbPath: string;
  private isFallback = false;
  private memoryCache: Map<string, DriveItem> = new Map();
  private syncMetadata: Map<string, string> = new Map();

  constructor() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    if (!fs.existsSync(userDataPath)) {
      try { fs.mkdirSync(userDataPath, { recursive: true }); } catch (e) {}
    }
    this.dbPath = path.join(userDataPath, 'drive_cache.db');
    this.initDatabase();
  }

  private initDatabase() {
    try {
      // Try to dynamically load better-sqlite3 using createRequire in ESM
      const Database = esmRequire('better-sqlite3');
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
      console.log(`[DbService] SQLite native database initialized at ${this.dbPath}`);
    } catch {
      console.log('[DbService] Fast in-memory & persistent JSON indexer active.');
      this.isFallback = true;
      this.loadMemoryFallback();
    }
  }

  private createTables() {
    if (!this.db) return;
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        parent_id TEXT,
        size INTEGER DEFAULT 0,
        modified_time TEXT NOT NULL,
        starred INTEGER DEFAULT 0,
        trashed INTEGER DEFAULT 0,
        is_folder INTEGER DEFAULT 0,
        thumbnail_link TEXT,
        web_view_link TEXT,
        icon_link TEXT,
        md5_checksum TEXT,
        version TEXT,
        synced_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_files_parent ON files (parent_id, trashed);
      CREATE INDEX IF NOT EXISTS idx_files_name ON files (name);
      CREATE INDEX IF NOT EXISTS idx_files_mime ON files (mime_type);
      CREATE INDEX IF NOT EXISTS idx_files_starred ON files (starred, trashed);
      CREATE INDEX IF NOT EXISTS idx_files_trashed ON files (trashed);
      CREATE INDEX IF NOT EXISTS idx_files_modified ON files (modified_time DESC);

      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  private loadMemoryFallback() {
    // Check if json cache exists on disk
    const fallbackPath = this.dbPath + '.json';
    try {
      if (fs.existsSync(fallbackPath)) {
        const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            this.memoryCache.set(item.id, item);
          }
        }
        if (data.syncMeta) {
          for (const [k, v] of Object.entries(data.syncMeta)) {
            this.syncMetadata.set(k, v as string);
          }
        }
      }
    } catch (e) {
      console.error('[DbService] Error reading fallback file cache:', e);
    }
  }

  private saveMemoryFallback() {
    if (!this.isFallback) return;
    const fallbackPath = this.dbPath + '.json';
    try {
      const data = {
        items: Array.from(this.memoryCache.values()),
        syncMeta: Object.fromEntries(this.syncMetadata.entries()),
      };
      fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[DbService] Error writing fallback file cache:', e);
    }
  }

  public upsertItem(item: DriveItem) {
    if (this.isFallback) {
      this.memoryCache.set(item.id, { ...item });
      this.saveMemoryFallback();
      return;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO files (
          id, name, mime_type, parent_id, size, modified_time, 
          starred, trashed, is_folder, thumbnail_link, web_view_link, icon_link, md5_checksum, version
        ) VALUES (
          @id, @name, @mimeType, @parentId, @size, @modifiedTime, 
          @starred, @trashed, @isFolder, @thumbnailLink, @webViewLink, @iconLink, @md5Checksum, @version
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          mime_type = excluded.mime_type,
          parent_id = excluded.parent_id,
          size = excluded.size,
          modified_time = excluded.modified_time,
          starred = excluded.starred,
          trashed = excluded.trashed,
          is_folder = excluded.is_folder,
          thumbnail_link = excluded.thumbnail_link,
          web_view_link = excluded.web_view_link,
          icon_link = excluded.icon_link,
          md5_checksum = excluded.md5_checksum,
          version = excluded.version,
          synced_at = strftime('%s', 'now')
      `);

      stmt.run({
        id: item.id,
        name: item.name,
        mimeType: item.mimeType,
        parentId: item.parentId || null,
        size: item.size || 0,
        modifiedTime: item.modifiedTime || new Date().toISOString(),
        starred: item.starred ? 1 : 0,
        trashed: item.trashed ? 1 : 0,
        isFolder: item.isFolder ? 1 : 0,
        thumbnailLink: item.thumbnailLink || null,
        webViewLink: item.webViewLink || null,
        iconLink: item.iconLink || null,
        md5Checksum: item.md5Checksum || null,
        version: item.version || null,
      });
    } catch (e) {
      console.error('[DbService] Error upserting item:', e);
    }
  }

  public upsertItems(items: DriveItem[]) {
    if (this.isFallback) {
      for (const item of items) {
        this.memoryCache.set(item.id, { ...item });
      }
      this.saveMemoryFallback();
      return;
    }

    try {
      const insertMany = this.db.transaction((records: DriveItem[]) => {
        const stmt = this.db.prepare(`
          INSERT INTO files (
            id, name, mime_type, parent_id, size, modified_time, 
            starred, trashed, is_folder, thumbnail_link, web_view_link, icon_link, md5_checksum, version
          ) VALUES (
            @id, @name, @mimeType, @parentId, @size, @modifiedTime, 
            @starred, @trashed, @isFolder, @thumbnailLink, @webViewLink, @iconLink, @md5Checksum, @version
          )
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            mime_type = excluded.mime_type,
            parent_id = excluded.parent_id,
            size = excluded.size,
            modified_time = excluded.modified_time,
            starred = excluded.starred,
            trashed = excluded.trashed,
            is_folder = excluded.is_folder,
            thumbnail_link = excluded.thumbnail_link,
            web_view_link = excluded.web_view_link,
            icon_link = excluded.icon_link,
            md5_checksum = excluded.md5_checksum,
            version = excluded.version,
            synced_at = strftime('%s', 'now')
        `);

        for (const item of records) {
          stmt.run({
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            parentId: item.parentId || null,
            size: item.size || 0,
            modifiedTime: item.modifiedTime || new Date().toISOString(),
            starred: item.starred ? 1 : 0,
            trashed: item.trashed ? 1 : 0,
            isFolder: item.isFolder ? 1 : 0,
            thumbnailLink: item.thumbnailLink || null,
            webViewLink: item.webViewLink || null,
            iconLink: item.iconLink || null,
            md5Checksum: item.md5Checksum || null,
            version: item.version || null,
          });
        }
      });

      insertMany(items);
    } catch (e) {
      console.error('[DbService] Error upserting items batch:', e);
    }
  }

  public getItemsByParentId(parentId?: string | null, includeTrashed = false, rootFolderId?: string | null): DriveItem[] {
    const isRoot = !parentId || parentId === 'root' || (rootFolderId && parentId === rootFolderId);
    const pid = isRoot ? 'root' : parentId;

    if (this.isFallback) {
      const results: DriveItem[] = [];
      for (const item of this.memoryCache.values()) {
        const itemIsRoot = !item.parentId || item.parentId === 'root' || item.parentId === '' || (rootFolderId && item.parentId === rootFolderId);
        if (!includeTrashed && item.trashed) continue;
        if (includeTrashed && !item.trashed) continue; // if trashed view, only show trashed
        if (includeTrashed) {
          results.push(item);
        } else if (isRoot ? itemIsRoot : item.parentId === pid) {
          results.push(item);
        }
      }
      return results.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    try {
      let rows: any[];
      if (includeTrashed) {
        const stmt = this.db.prepare(`
          SELECT * FROM files WHERE trashed = 1 ORDER BY modified_time DESC
        `);
        rows = stmt.all();
      } else if (isRoot) {
        const stmt = this.db.prepare(`
          SELECT * FROM files 
          WHERE (parent_id IS NULL OR parent_id = 'root' OR parent_id = '' OR parent_id = ?) 
            AND trashed = 0 
          ORDER BY is_folder DESC, name ASC
        `);
        rows = stmt.all(rootFolderId || 'root');
      } else {
        const stmt = this.db.prepare(`
          SELECT * FROM files 
          WHERE parent_id = ? AND trashed = 0 
          ORDER BY is_folder DESC, name ASC
        `);
        rows = stmt.all(pid);
      }

      return rows.map(this.mapRowToDriveItem);
    } catch (e) {
      console.error('[DbService] Error getting items by parent:', e);
      return [];
    }
  }

  public getStarredItems(): DriveItem[] {
    if (this.isFallback) {
      return Array.from(this.memoryCache.values())
        .filter(item => item.starred && !item.trashed)
        .sort((a, b) => (a.isFolder === b.isFolder ? a.name.localeCompare(b.name) : a.isFolder ? -1 : 1));
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM files WHERE starred = 1 AND trashed = 0 ORDER BY is_folder DESC, name ASC
      `);
      return stmt.all().map(this.mapRowToDriveItem);
    } catch (e) {
      console.error('[DbService] Error getting starred items:', e);
      return [];
    }
  }

  public getRecentItems(limit = 50): DriveItem[] {
    if (this.isFallback) {
      return Array.from(this.memoryCache.values())
        .filter(item => !item.trashed && !item.isFolder)
        .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
        .slice(0, limit);
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM files WHERE trashed = 0 AND is_folder = 0 ORDER BY modified_time DESC LIMIT ?
      `);
      return stmt.all(limit).map(this.mapRowToDriveItem);
    } catch (e) {
      console.error('[DbService] Error getting recent items:', e);
      return [];
    }
  }

  public getItemById(id: string): DriveItem | null {
    if (this.isFallback) {
      return this.memoryCache.get(id) || null;
    }

    try {
      const stmt = this.db.prepare(`SELECT * FROM files WHERE id = ?`);
      const row = stmt.get(id);
      return row ? this.mapRowToDriveItem(row) : null;
    } catch (e) {
      console.error('[DbService] Error getting item by id:', e);
      return null;
    }
  }

  public searchFiles(query: string, filters?: FilterOptions): DriveItem[] {
    const cleanQuery = (query || '').trim().toLowerCase();

    if (this.isFallback) {
      return Array.from(this.memoryCache.values()).filter(item => {
        if (!filters?.trashed && item.trashed) return false;
        if (filters?.trashed && !item.trashed) return false;
        if (filters?.starredOnly && !item.starred) return false;

        if (filters?.category && filters.category !== 'all') {
          if (!this.matchesCategory(item.mimeType, item.name, filters.category)) return false;
        }

        if (!cleanQuery) return true;
        return item.name.toLowerCase().includes(cleanQuery);
      }).slice(0, 200);
    }

    try {
      let sql = `SELECT * FROM files WHERE trashed = ${filters?.trashed ? 1 : 0}`;
      const params: any[] = [];

      if (filters?.starredOnly) {
        sql += ` AND starred = 1`;
      }

      if (cleanQuery) {
        sql += ` AND LOWER(name) LIKE ?`;
        params.push(`%${cleanQuery}%`);
      }

      sql += ` ORDER BY is_folder DESC, modified_time DESC LIMIT 200`;

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);
      let items: DriveItem[] = rows.map((r: any) => this.mapRowToDriveItem(r));

      if (filters?.category && filters.category !== 'all') {
        items = items.filter((item: DriveItem) => this.matchesCategory(item.mimeType, item.name, filters.category!));
      }

      return items;
    } catch (e) {
      console.error('[DbService] Error searching files:', e);
      return [];
    }
  }

  private matchesCategory(mimeType: string, name: string, category: string): boolean {
    const mime = (mimeType || '').toLowerCase();
    const ext = name.split('.').pop()?.toLowerCase() || '';

    switch (category) {
      case 'documents':
        return mime.includes('pdf') || mime.includes('document') || mime.includes('sheet') || 
               mime.includes('presentation') || mime.includes('text') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md'].includes(ext);
      case 'images':
        return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext);
      case 'videos':
        return mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext);
      case 'audio':
        return mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
      case 'archives':
        return mime.includes('zip') || mime.includes('compressed') || mime.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext);
      case 'code':
        return mime.includes('json') || mime.includes('javascript') || mime.includes('html') || 
               ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'html', 'css', 'scss', 'sql', 'sh'].includes(ext);
      default:
        return true;
    }
  }

  public getFolderTree(): DriveFolder[] {
    let allFolders: DriveItem[] = [];

    if (this.isFallback) {
      allFolders = Array.from(this.memoryCache.values()).filter(i => i.isFolder && !i.trashed);
    } else {
      try {
        const stmt = this.db.prepare(`
          SELECT * FROM files WHERE is_folder = 1 AND trashed = 0 ORDER BY name ASC
        `);
        allFolders = stmt.all().map(this.mapRowToDriveItem);
      } catch (e) {
        console.error('[DbService] Error fetching folder tree:', e);
        return [];
      }
    }

    // Build hierarchy
    const folderMap = new Map<string, DriveFolder>();
    for (const f of allFolders) {
      folderMap.set(f.id, {
        id: f.id,
        name: f.name,
        parentId: f.parentId || 'root',
        children: [],
      });
    }

    const rootNodes: DriveFolder[] = [];

    for (const folder of folderMap.values()) {
      if (!folder.parentId || folder.parentId === 'root' || !folderMap.has(folder.parentId)) {
        rootNodes.push(folder);
      } else {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(folder);
        }
      }
    }

    return rootNodes;
  }

  public deleteItem(id: string, permanent = false) {
    if (this.isFallback) {
      if (permanent) {
        this.memoryCache.delete(id);
      } else {
        const item = this.memoryCache.get(id);
        if (item) {
          item.trashed = true;
          this.memoryCache.set(id, item);
        }
      }
      this.saveMemoryFallback();
      return true;
    }

    try {
      if (permanent) {
        const stmt = this.db.prepare(`DELETE FROM files WHERE id = ?`);
        stmt.run(id);
      } else {
        const stmt = this.db.prepare(`UPDATE files SET trashed = 1 WHERE id = ?`);
        stmt.run(id);
      }
      return true;
    } catch (e) {
      console.error('[DbService] Error deleting item:', e);
      return false;
    }
  }

  public emptyTrash() {
    if (this.isFallback) {
      for (const [id, item] of this.memoryCache.entries()) {
        if (item.trashed) {
          this.memoryCache.delete(id);
        }
      }
      this.saveMemoryFallback();
      return true;
    }

    try {
      this.db.prepare(`DELETE FROM files WHERE trashed = 1`).run();
      return true;
    } catch (e) {
      console.error('[DbService] Error emptying trash in SQLite:', e);
      return false;
    }
  }

  public restoreItem(id: string) {
    if (this.isFallback) {
      const item = this.memoryCache.get(id);
      if (item) {
        item.trashed = false;
        this.memoryCache.set(id, item);
        this.saveMemoryFallback();
      }
      return true;
    }

    try {
      const stmt = this.db.prepare(`UPDATE files SET trashed = 0 WHERE id = ?`);
      stmt.run(id);
      return true;
    } catch (e) {
      console.error('[DbService] Error restoring item:', e);
      return false;
    }
  }

  public renameItem(id: string, newName: string) {
    if (this.isFallback) {
      const item = this.memoryCache.get(id);
      if (item) {
        item.name = newName;
        item.modifiedTime = new Date().toISOString();
        this.memoryCache.set(id, item);
        this.saveMemoryFallback();
        return item;
      }
      return null;
    }

    try {
      const stmt = this.db.prepare(`UPDATE files SET name = ?, modified_time = ? WHERE id = ?`);
      const now = new Date().toISOString();
      stmt.run(newName, now, id);
      return this.getItemById(id);
    } catch (e) {
      console.error('[DbService] Error renaming item:', e);
      return null;
    }
  }

  public moveItem(id: string, newParentId: string) {
    if (this.isFallback) {
      const item = this.memoryCache.get(id);
      if (item) {
        item.parentId = newParentId;
        item.modifiedTime = new Date().toISOString();
        this.memoryCache.set(id, item);
        this.saveMemoryFallback();
        return item;
      }
      return null;
    }

    try {
      const stmt = this.db.prepare(`UPDATE files SET parent_id = ?, modified_time = ? WHERE id = ?`);
      const now = new Date().toISOString();
      stmt.run(newParentId, now, id);
      return this.getItemById(id);
    } catch (e) {
      console.error('[DbService] Error moving item:', e);
      return null;
    }
  }

  public toggleStar(id: string, starred: boolean) {
    if (this.isFallback) {
      const item = this.memoryCache.get(id);
      if (item) {
        item.starred = starred;
        this.memoryCache.set(id, item);
        this.saveMemoryFallback();
      }
      return true;
    }

    try {
      const stmt = this.db.prepare(`UPDATE files SET starred = ? WHERE id = ?`);
      stmt.run(starred ? 1 : 0, id);
      return true;
    } catch (e) {
      console.error('[DbService] Error toggling star:', e);
      return false;
    }
  }

  public getStats() {
    if (this.isFallback) {
      let totalFiles = 0;
      let totalFolders = 0;
      let dbSizeBytes = 0;
      for (const item of this.memoryCache.values()) {
        if (item.isFolder) totalFolders++;
        else totalFiles++;
      }
      const fallbackPath = this.dbPath + '.json';
      if (fs.existsSync(fallbackPath)) {
        dbSizeBytes = fs.statSync(fallbackPath).size;
      }
      return {
        totalItems: this.memoryCache.size,
        totalFolders,
        totalFiles,
        dbSizeBytes,
      };
    }

    try {
      const countStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as totalItems,
          SUM(CASE WHEN is_folder = 1 THEN 1 ELSE 0 END) as totalFolders,
          SUM(CASE WHEN is_folder = 0 THEN 1 ELSE 0 END) as totalFiles
        FROM files
      `);
      const counts = countStmt.get();
      let dbSizeBytes = 0;
      if (fs.existsSync(this.dbPath)) {
        dbSizeBytes = fs.statSync(this.dbPath).size;
      }
      return {
        totalItems: counts.totalItems || 0,
        totalFolders: counts.totalFolders || 0,
        totalFiles: counts.totalFiles || 0,
        dbSizeBytes,
      };
    } catch (e) {
      return { totalItems: 0, totalFolders: 0, totalFiles: 0, dbSizeBytes: 0 };
    }
  }

  public clearCache() {
    if (this.isFallback) {
      this.memoryCache.clear();
      this.syncMetadata.clear();
      this.saveMemoryFallback();
      return true;
    }

    try {
      this.db.exec(`DELETE FROM files; DELETE FROM sync_meta; VACUUM;`);
      return true;
    } catch (e) {
      console.error('[DbService] Error clearing cache:', e);
      return false;
    }
  }

  public getSyncToken(): string | null {
    if (this.isFallback) {
      return this.syncMetadata.get('change_token') || null;
    }

    try {
      const stmt = this.db.prepare(`SELECT value FROM sync_meta WHERE key = 'change_token'`);
      const row = stmt.get();
      return row ? row.value : null;
    } catch (e) {
      return null;
    }
  }

  public setSyncToken(token: string) {
    if (this.isFallback) {
      this.syncMetadata.set('change_token', token);
      this.saveMemoryFallback();
      return;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO sync_meta (key, value) VALUES ('change_token', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);
      stmt.run(token);
    } catch (e) {
      console.error('[DbService] Error setting sync token:', e);
    }
  }

  private mapRowToDriveItem(row: any): DriveItem {
    return {
      id: row.id,
      name: row.name,
      mimeType: row.mime_type,
      parentId: row.parent_id,
      size: row.size,
      modifiedTime: row.modified_time,
      starred: Boolean(row.starred),
      trashed: Boolean(row.trashed),
      isFolder: Boolean(row.is_folder),
      thumbnailLink: row.thumbnail_link,
      webViewLink: row.web_view_link,
      iconLink: row.icon_link,
      md5Checksum: row.md5_checksum,
      version: row.version,
    };
  }
}

export const dbService = new DbService();
