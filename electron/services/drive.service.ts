import { google } from 'googleapis';
import mime from 'mime-types';
import { Readable } from 'stream';
import { authService } from './auth.service';
import { dbService } from './db.service';
import type { DriveItem, DriveFolder, StorageQuota, FilterOptions } from '../../src/types/drive';

export class DriveService {
  private rootFolderId: string | null = null;

  constructor() {
    // Pure production service
  }

  private getDriveClient() {
    const oauth2 = authService.getAuthenticatedClient();
    if (!oauth2) return null;
    return google.drive({ version: 'v3', auth: oauth2 });
  }

  public async getRootFolderId(): Promise<string> {
    if (this.rootFolderId) return this.rootFolderId;
    const drive = this.getDriveClient();
    if (!drive) return 'root';
    try {
      const res = await drive.files.get({ fileId: 'root', fields: 'id' });
      this.rootFolderId = res.data.id || 'root';
      return this.rootFolderId;
    } catch (e) {
      return 'root';
    }
  }

  public async fetchItems(parentId?: string | null, forceSync = false): Promise<DriveItem[]> {
    const rootId = await this.getRootFolderId();
    const isRoot = !parentId || parentId === 'root' || parentId === rootId;
    const normalizedPid = isRoot ? 'root' : parentId;

    // Check SQLite cache first for instant sub-millisecond return
    const cached = dbService.getItemsByParentId(normalizedPid, false, rootId);
    if (cached.length > 0 && !forceSync) {
      return cached;
    }

    const drive = this.getDriveClient();
    if (!drive) {
      return cached;
    }

    try {
      const q = isRoot
        ? "'root' in parents and trashed = false"
        : `'${normalizedPid}' in parents and trashed = false`;

      const res = await drive.files.list({
        q,
        fields: 'files(id, name, mimeType, parents, size, modifiedTime, starred, trashed, thumbnailLink, webViewLink, iconLink, md5Checksum, version)',
        pageSize: 1000,
        orderBy: 'folder, name',
      });

      const files = (res.data.files || []).map(f => this.mapGoogleFileToDriveItem(f));
      dbService.upsertItems(files);
      return dbService.getItemsByParentId(normalizedPid, false, rootId);
    } catch (e) {
      console.error('[DriveService] Error fetching from Drive API, falling back to SQLite cache:', e);
      return cached;
    }
  }

  public async fetchFolderTree(): Promise<DriveFolder[]> {
    return dbService.getFolderTree();
  }

  public async search(query: string, filters?: FilterOptions): Promise<DriveItem[]> {
    return dbService.searchFiles(query, filters);
  }

  public async createFolder(name: string, parentId?: string | null): Promise<DriveItem> {
    const rootId = await this.getRootFolderId();
    const isRoot = !parentId || parentId === 'root' || parentId === rootId;
    const normalizedPid = isRoot ? 'root' : parentId;
    const drive = this.getDriveClient();

    if (!drive) {
      throw new Error('Google Drive is not authenticated');
    }

    try {
      const parents = isRoot ? undefined : [normalizedPid];
      const res = await drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents,
        },
        fields: 'id, name, mimeType, parents, size, modifiedTime, starred, trashed',
      });

      const newItem = this.mapGoogleFileToDriveItem(res.data);
      dbService.upsertItem(newItem);
      return newItem;
    } catch (e: any) {
      console.error('[DriveService] Error creating folder in Google Drive:', e);
      throw new Error(e.message || 'Failed to create folder in Google Drive');
    }
  }

  public async createFile(name: string, content = '', parentId?: string | null): Promise<DriveItem> {
    const rootId = await this.getRootFolderId();
    const isRoot = !parentId || parentId === 'root' || parentId === rootId;
    const normalizedPid = isRoot ? 'root' : parentId;
    const drive = this.getDriveClient();

    if (!drive) {
      throw new Error('Google Drive is not authenticated');
    }

    try {
      const mimeType = (mime.lookup(name) as string) || 'text/plain';
      const parents = isRoot ? undefined : [normalizedPid];
      const mediaStream = new Readable();
      mediaStream.push(content);
      mediaStream.push(null);

      const res = await drive.files.create({
        requestBody: {
          name,
          mimeType,
          parents,
        },
        media: {
          mimeType,
          body: mediaStream,
        },
        fields: 'id, name, mimeType, parents, size, modifiedTime, starred, trashed',
      });

      const newItem = this.mapGoogleFileToDriveItem(res.data);
      dbService.upsertItem(newItem);
      return newItem;
    } catch (e: any) {
      console.error('[DriveService] Error creating file in Google Drive:', e);
      throw new Error(e.message || 'Failed to create file in Google Drive');
    }
  }

  public async renameItem(id: string, newName: string): Promise<DriveItem> {
    const drive = this.getDriveClient();

    if (!drive) {
      throw new Error('Google Drive is not authenticated');
    }

    try {
      const res = await drive.files.update({
        fileId: id,
        requestBody: { name: newName },
        fields: 'id, name, mimeType, parents, size, modifiedTime, starred, trashed',
      });

      const updated = this.mapGoogleFileToDriveItem(res.data);
      dbService.upsertItem(updated);
      return updated;
    } catch (e: any) {
      console.error('[DriveService] Error renaming item:', e);
      throw new Error(e.message || 'Failed to rename item in Google Drive');
    }
  }

  public async deleteItem(id: string, permanent = false): Promise<boolean> {
    const drive = this.getDriveClient();

    if (!drive) {
      dbService.deleteItem(id, permanent);
      return true;
    }

    try {
      if (permanent) {
        await drive.files.delete({ fileId: id });
        dbService.deleteItem(id, true);
      } else {
        await drive.files.update({
          fileId: id,
          requestBody: { trashed: true },
        });
        dbService.deleteItem(id, false);
      }
      return true;
    } catch (e: any) {
      console.error('[DriveService] Error deleting item:', e);
      return false;
    }
  }

  public async restoreItem(id: string): Promise<boolean> {
    const drive = this.getDriveClient();

    if (!drive) {
      return dbService.restoreItem(id);
    }

    try {
      await drive.files.update({
        fileId: id,
        requestBody: { trashed: false },
      });
      dbService.restoreItem(id);
      return true;
    } catch (e) {
      console.error('[DriveService] Error restoring item:', e);
      return false;
    }
  }

  public async moveItem(id: string, newParentId: string, oldParentId?: string): Promise<DriveItem> {
    const targetParent = (!newParentId || newParentId === 'root') ? 'root' : newParentId;
    const drive = this.getDriveClient();

    if (!drive) {
      const item = dbService.moveItem(id, targetParent);
      if (!item) throw new Error('Item not found');
      return item;
    }

    try {
      const itemBefore = dbService.getItemById(id);
      const prevParent = oldParentId || itemBefore?.parentId || 'root';

      const res = await drive.files.update({
        fileId: id,
        addParents: targetParent === 'root' ? undefined : targetParent,
        removeParents: prevParent === 'root' ? undefined : prevParent,
        fields: 'id, name, mimeType, parents, size, modifiedTime, starred, trashed',
      });

      const updated = this.mapGoogleFileToDriveItem(res.data);
      dbService.upsertItem(updated);
      return updated;
    } catch (e: any) {
      console.error('[DriveService] Error moving item:', e);
      throw new Error(e.message || 'Failed to move item in Google Drive');
    }
  }

  public async duplicateItem(id: string): Promise<DriveItem> {
    const item = dbService.getItemById(id);
    if (!item) throw new Error('Source item not found');

    const drive = this.getDriveClient();
    const newName = `Copy of ${item.name}`;

    if (!drive) {
      throw new Error('Google Drive is not authenticated');
    }

    try {
      const res = await drive.files.copy({
        fileId: id,
        requestBody: { name: newName },
        fields: 'id, name, mimeType, parents, size, modifiedTime, starred, trashed',
      });

      const copyItem = this.mapGoogleFileToDriveItem(res.data);
      dbService.upsertItem(copyItem);
      return copyItem;
    } catch (e: any) {
      console.error('[DriveService] Error duplicating item:', e);
      throw new Error(e.message || 'Failed to duplicate file');
    }
  }

  public async toggleStar(id: string, starred: boolean): Promise<boolean> {
    const drive = this.getDriveClient();

    if (!drive) {
      return dbService.toggleStar(id, starred);
    }

    try {
      await drive.files.update({
        fileId: id,
        requestBody: { starred },
      });
      dbService.toggleStar(id, starred);
      return true;
    } catch (e) {
      console.error('[DriveService] Error toggling star:', e);
      return false;
    }
  }

  public async getQuota(): Promise<StorageQuota> {
    const drive = this.getDriveClient();

    if (!drive) {
      return {
        limit: 0,
        usage: 0,
        usageInDrive: 0,
        usageInTrash: 0,
        userDisplayName: '',
        userEmail: '',
      };
    }

    try {
      const res = await drive.about.get({
        fields: 'storageQuota, user',
      });

      const quota = res.data.storageQuota;
      const user = res.data.user;

      const limit = quota?.limit ? parseInt(quota.limit, 10) : 0;
      const usage = quota?.usage ? parseInt(quota.usage, 10) : 0;
      const usageInDrive = quota?.usageInDrive ? parseInt(quota.usageInDrive, 10) : 0;
      const usageInTrash = quota?.usageInDriveTrash ? parseInt(quota.usageInDriveTrash, 10) : 0;

      return {
        limit,
        usage,
        usageInDrive,
        usageInTrash,
        userDisplayName: user?.displayName || 'Google User',
        userEmail: user?.emailAddress || '',
        userPhotoLink: user?.photoLink || '',
      };
    } catch (e) {
      console.error('[DriveService] Error fetching storage quota:', e);
      return {
        limit: 0,
        usage: 0,
        usageInDrive: 0,
        usageInTrash: 0,
      };
    }
  }

  public async syncChanges(): Promise<{ added: number; updated: number; deleted: number }> {
    const drive = this.getDriveClient();
    if (!drive) {
      return { added: 0, updated: 0, deleted: 0 };
    }

    try {
      let pageToken = dbService.getSyncToken();
      if (!pageToken) {
        const tokenRes = await drive.changes.getStartPageToken();
        pageToken = tokenRes.data.startPageToken || null;
        if (pageToken) dbService.setSyncToken(pageToken);
        return { added: 0, updated: 0, deleted: 0 };
      }

      let added = 0;
      let updated = 0;
      let deleted = 0;
      let newStartToken = pageToken;

      while (pageToken) {
        const res: any = await drive.changes.list({
          pageToken,
          fields: 'nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, parents, size, modifiedTime, starred, trashed, thumbnailLink, webViewLink, iconLink, md5Checksum, version))',
          pageSize: 1000,
        });

        for (const change of res.data.changes || []) {
          if (change.removed || (change.file && change.file.trashed)) {
            dbService.deleteItem(change.fileId!);
            deleted++;
          } else if (change.file) {
            const item = this.mapGoogleFileToDriveItem(change.file);
            dbService.upsertItem(item);
            updated++;
          }
        }

        if (res.data.newStartPageToken) {
          newStartToken = res.data.newStartPageToken;
        }

        pageToken = res.data.nextPageToken || null;
      }

      if (newStartToken) {
        dbService.setSyncToken(newStartToken);
      }

      return { added, updated, deleted };
    } catch (e) {
      console.error('[DriveService] Error in syncChanges:', e);
      return { added: 0, updated: 0, deleted: 0 };
    }
  }

  public async fetchTrashItems(forceSync = false): Promise<DriveItem[]> {
    // Check SQLite cache first for instant sub-millisecond return
    const cached = dbService.getItemsByParentId(null, true);
    if (cached.length > 0 && !forceSync) {
      return cached;
    }

    const drive = this.getDriveClient();
    if (!drive) {
      return cached;
    }

    try {
      const res = await drive.files.list({
        q: 'trashed = true',
        fields: 'files(id, name, mimeType, parents, size, modifiedTime, starred, trashed, thumbnailLink, webViewLink, iconLink, md5Checksum, version)',
        pageSize: 1000,
        orderBy: 'modifiedTime desc',
      });

      const files = (res.data.files || []).map(f => this.mapGoogleFileToDriveItem(f));
      dbService.upsertItems(files);
      return dbService.getItemsByParentId(null, true);
    } catch (e) {
      console.error('[DriveService] Error fetching trashed items from Drive API:', e);
      return cached;
    }
  }

  public async emptyTrash(): Promise<boolean> {
    const drive = this.getDriveClient();
    if (!drive) {
      dbService.emptyTrash();
      return true;
    }

    try {
      await drive.files.emptyTrash();
      dbService.emptyTrash();
      return true;
    } catch (e) {
      console.error('[DriveService] Error emptying trash:', e);
      return false;
    }
  }

  private mapGoogleFileToDriveItem(f: any): DriveItem {
    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
    let parentId = 'root';
    if (f.parents && f.parents.length > 0) {
      const p = f.parents[0];
      if (p === 'root' || (this.rootFolderId && p === this.rootFolderId)) {
        parentId = 'root';
      } else {
        parentId = p;
      }
    }

    return {
      id: f.id || '',
      name: f.name || 'Untitled',
      mimeType: f.mimeType || 'application/octet-stream',
      parentId,
      size: f.size ? parseInt(f.size, 10) : 0,
      modifiedTime: f.modifiedTime || new Date().toISOString(),
      starred: Boolean(f.starred),
      trashed: Boolean(f.trashed),
      isFolder,
      thumbnailLink: f.thumbnailLink || null,
      webViewLink: f.webViewLink || null,
      iconLink: f.iconLink || null,
      md5Checksum: f.md5Checksum || null,
      version: f.version || null,
    };
  }
}

export const driveService = new DriveService();
