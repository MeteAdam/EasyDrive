import fs from 'fs';
import path from 'path';
import https from 'https';
import mime from 'mime-types';
import axios from 'axios';
import { BrowserWindow } from 'electron';
import { authService } from './auth.service';
import { driveService } from './drive.service';
import { dbService } from './db.service';
import { IPC_CHANNELS } from '../ipc/channels';
import type { TransferItem, TransferStatus } from '../../src/types/drive';

// High-performance reusable HTTPS Keep-Alive agent to eliminate SSL handshake latency
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 25,
  timeout: 60000,
  keepAliveMsecs: 60000,
});

export class TransferService {
  private transfers: Map<string, TransferItem> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private maxConcurrent = 5;
  private activeCount = 0;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startQueueProcessor();
  }

  private emitProgress(item: TransferItem) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.TRANSFER_PROGRESS_EVENT, item);
      }
    }
  }

  private startQueueProcessor() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.processQueue();
    }, 250);
  }

  private async processQueue() {
    const settings = authService.getSettings();
    this.maxConcurrent = settings.maxConcurrentTransfers || 5;

    if (this.activeCount >= this.maxConcurrent) return;

    for (const item of this.transfers.values()) {
      if (this.activeCount >= this.maxConcurrent) break;

      if (item.status === 'queued') {
        item.status = 'running';
        item.startedAt = Date.now();
        this.activeCount++;
        this.emitProgress(item);

        if (item.type === 'upload') {
          this.executeUpload(item).finally(() => {
            this.activeCount = Math.max(0, this.activeCount - 1);
          });
        } else if (item.type === 'download') {
          this.executeDownload(item).finally(() => {
            this.activeCount = Math.max(0, this.activeCount - 1);
          });
        }
      }
    }
  }

  public async uploadFiles(filePaths: string[], destinationFolderId?: string): Promise<TransferItem[]> {
    const targetFolder = destinationFolderId || 'root';
    const queuedItems: TransferItem[] = [];

    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) continue;
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        const subItems = await this.uploadDirectory(filePath, targetFolder);
        queuedItems.push(...subItems);
        continue;
      }

      const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const fileName = path.basename(filePath);

      const transferItem: TransferItem = {
        id,
        name: fileName,
        type: 'upload',
        totalBytes: stats.size,
        transferredBytes: 0,
        speed: 0,
        progress: 0,
        eta: 0,
        status: 'queued',
        localPath: filePath,
        parentId: targetFolder,
      };

      this.transfers.set(id, transferItem);
      queuedItems.push(transferItem);
      this.emitProgress(transferItem);
    }

    return queuedItems;
  }

  public async uploadDirectory(dirPath: string, destinationFolderId?: string): Promise<TransferItem[]> {
    const dirName = path.basename(dirPath);
    // Create new remote root folder for this directory
    const newFolder = await driveService.createFolder(dirName, destinationFolderId);
    const queuedItems: TransferItem[] = [];

    const traverse = async (currentDir: string, parentFolderId: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        const localFiles: string[] = [];

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            const subFolder = await driveService.createFolder(entry.name, parentFolderId);
            await traverse(fullPath, subFolder.id);
          } else if (entry.isFile()) {
            localFiles.push(fullPath);
          }
        }

        if (localFiles.length > 0) {
          const items = await this.uploadFiles(localFiles, parentFolderId);
          queuedItems.push(...items);
        }
      } catch (e) {
        console.error('[TransferService] Error traversing directory:', e);
      }
    };

    await traverse(dirPath, newFolder.id);
    return queuedItems;
  }

  public async downloadItem(driveItemId: string, destinationDirectory?: string): Promise<TransferItem> {
    const item = dbService.getItemById(driveItemId);
    if (!item) throw new Error('File not found');

    const downloadsDir = destinationDirectory || (authService.getSettings().defaultDownloadPath || process.cwd());
    const targetFilePath = path.join(downloadsDir, item.name);

    const id = `download-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const transferItem: TransferItem = {
      id,
      name: item.name,
      type: 'download',
      totalBytes: item.size || 1024 * 1024,
      transferredBytes: 0,
      speed: 0,
      progress: 0,
      eta: 0,
      status: 'queued',
      localPath: targetFilePath,
      remoteId: driveItemId,
    };

    this.transfers.set(id, transferItem);
    this.emitProgress(transferItem);
    return transferItem;
  }

  private async executeUpload(item: TransferItem) {
    const oauth2 = authService.getAuthenticatedClient();

    if (!oauth2) {
      item.status = 'failed';
      item.error = 'Google Drive not authenticated';
      this.emitProgress(item);
      return;
    }

    try {
      const abortCtrl = new AbortController();
      this.abortControllers.set(item.id, abortCtrl);

      const mimeType = mime.lookup(item.localPath) || 'application/octet-stream';
      const fileSize = item.totalBytes;
      const token = (await oauth2.getAccessToken()).token;

      let lastUploaded = 0;
      let lastTime = Date.now();

      const onProgress = (progressEvent: any) => {
        if (item.status !== 'running') return;
        const loaded = progressEvent.loaded || 0;
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;

        if (timeDiff >= 0.25) {
          const bytesDiff = loaded - lastUploaded;
          item.speed = Math.max(0, Math.round(bytesDiff / timeDiff));
          const remainingBytes = fileSize - loaded;
          item.eta = item.speed > 0 ? Math.round(remainingBytes / item.speed) : 0;
          lastUploaded = loaded;
          lastTime = now;
        }

        item.transferredBytes = loaded;
        item.progress = Math.min(100, Math.round((loaded / Math.max(1, fileSize)) * 100));
        this.emitProgress(item);
      };

      const parentList = (item.parentId && item.parentId !== 'root') ? [item.parentId] : undefined;

      // SPEED OPTIMIZATION:
      // For files <= 5MB: Use single-request Multipart upload for sub-second upload speeds
      // For files > 5MB: Use Resumable upload with large 4MB stream buffers and keep-alive socket
      if (fileSize <= 5 * 1024 * 1024) {
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadata = {
          name: item.name,
          parents: parentList,
        };

        const metadataPart = delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`;

        const fileBuffer = fs.readFileSync(item.localPath);
        const multipartBody = Buffer.concat([
          Buffer.from(metadataPart, 'utf8'),
          fileBuffer,
          Buffer.from(closeDelimiter, 'utf8'),
        ]);

        await axios.post(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          multipartBody,
          {
            httpsAgent,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
              'Content-Length': multipartBody.length,
            },
            signal: abortCtrl.signal,
            onUploadProgress: onProgress,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }
        );
      } else {
        // Robust Chunked Resumable Upload for large files (1.6GB+)
        const initRes = await axios.post(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
          {
            name: item.name,
            parents: parentList,
          },
          {
            httpsAgent,
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Upload-Content-Type': mimeType,
              'X-Upload-Content-Length': fileSize.toString(),
              'Content-Type': 'application/json; charset=UTF-8',
            },
            signal: abortCtrl.signal,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }
        );

        const sessionUri = initRes.headers['location'];
        if (!sessionUri) {
          throw new Error('Failed to get Google Drive upload session URL');
        }

        const CHUNK_SIZE = 32 * 1024 * 1024; // 32MB chunks (128 x 256KB, Google Drive optimal for high speed)
        let uploadedBytes = 0;

        while (uploadedBytes < fileSize) {
          if (abortCtrl.signal.aborted || (item.status as string) === 'paused' || (item.status as string) === 'cancelled') {
            return;
          }

          const start = uploadedBytes;
          const end = Math.min(uploadedBytes + CHUNK_SIZE - 1, fileSize - 1);
          const chunkLength = end - start + 1;

          const chunkBuffer = Buffer.alloc(chunkLength);
          const fd = fs.openSync(item.localPath, 'r');
          fs.readSync(fd, chunkBuffer, 0, chunkLength, start);
          fs.closeSync(fd);

          let chunkSuccess = false;
          let retries = 0;

          while (!chunkSuccess && retries < 5) {
            if (abortCtrl.signal.aborted || (item.status as string) === 'paused' || (item.status as string) === 'cancelled') {
              return;
            }

            try {
              const putRes = await axios.put(sessionUri, chunkBuffer, {
                httpsAgent,
                headers: {
                  'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                  'Content-Length': chunkLength.toString(),
                  'Content-Type': mimeType,
                },
                signal: abortCtrl.signal,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                onUploadProgress: (progressEvent) => {
                  if ((item.status as string) !== 'running') return;
                  const currentTransferred = start + (progressEvent.loaded || 0);
                  const now = Date.now();
                  const timeDiff = (now - lastTime) / 1000;
                  if (timeDiff >= 0.25) {
                    const bytesDiff = currentTransferred - lastUploaded;
                    item.speed = Math.max(0, Math.round(bytesDiff / timeDiff));
                    const remainingBytes = fileSize - currentTransferred;
                    item.eta = item.speed > 0 ? Math.round(remainingBytes / item.speed) : 0;
                    lastUploaded = currentTransferred;
                    lastTime = now;
                  }
                  item.transferredBytes = Math.min(fileSize, currentTransferred);
                  item.progress = Math.min(100, Math.round((currentTransferred / Math.max(1, fileSize)) * 100));
                  this.emitProgress(item);
                },
                validateStatus: (status) => (status >= 200 && status < 300) || status === 308,
              });

              if (putRes.status === 308 || putRes.status === 200 || putRes.status === 201) {
                chunkSuccess = true;
                uploadedBytes = end + 1;
                item.transferredBytes = uploadedBytes;
                item.progress = Math.min(100, Math.round((uploadedBytes / Math.max(1, fileSize)) * 100));
                this.emitProgress(item);
              } else {
                throw new Error(`Upload chunk error: HTTP ${putRes.status}`);
              }
            } catch (chunkErr: any) {
              if (abortCtrl.signal.aborted || (item.status as string) === 'paused' || (item.status as string) === 'cancelled') {
                return;
              }
              retries++;
              if (retries >= 5) {
                throw chunkErr;
              }
              await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            }
          }
        }
      }

      item.status = 'completed';
      item.progress = 100;
      item.transferredBytes = fileSize;
      item.speed = 0;
      item.eta = 0;
      item.completedAt = Date.now();
      this.emitProgress(item);

      // Trigger Drive sync for the parent folder
      driveService.fetchItems(item.parentId, true);
    } catch (err: any) {
      if ((item.status as string) !== 'cancelled' && (item.status as string) !== 'paused') {
        item.status = 'failed';
        const serverMsg = err.response?.data?.error?.message || err.response?.data?.error_description;
        item.error = serverMsg || err.message || 'Upload failed';
        console.error(`[TransferService] Upload failed for ${item.name}:`, err.response?.data || err.message);
        this.emitProgress(item);
      }
    } finally {
      this.abortControllers.delete(item.id);
    }
  }

  private async executeDownload(item: TransferItem) {
    const oauth2 = authService.getAuthenticatedClient();

    if (!oauth2) {
      item.status = 'failed';
      item.error = 'Google Drive not authenticated';
      this.emitProgress(item);
      return;
    }

    try {
      const abortCtrl = new AbortController();
      this.abortControllers.set(item.id, abortCtrl);

      const token = (await oauth2.getAccessToken()).token;
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${item.remoteId}?alt=media`;

      const response = await axios.get(downloadUrl, {
        httpsAgent,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'stream',
        signal: abortCtrl.signal,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const writeStream = fs.createWriteStream(item.localPath, {
        highWaterMark: 4 * 1024 * 1024,
      });
      let downloaded = 0;
      let lastDownloaded = 0;
      let lastTime = Date.now();

      response.data.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        item.transferredBytes = downloaded;

        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;

        if (timeDiff >= 0.25) {
          const bytesDiff = downloaded - lastDownloaded;
          item.speed = Math.max(0, Math.round(bytesDiff / timeDiff));
          const remaining = item.totalBytes - downloaded;
          item.eta = item.speed > 0 ? Math.round(remaining / item.speed) : 0;
          lastDownloaded = downloaded;
          lastTime = now;
        }

        item.progress = Math.min(100, Math.round((downloaded / Math.max(1, item.totalBytes)) * 100));
        this.emitProgress(item);
      });

      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err: any) => reject(err));
      });

      item.status = 'completed';
      item.progress = 100;
      item.transferredBytes = item.totalBytes;
      item.speed = 0;
      item.eta = 0;
      item.completedAt = Date.now();
      this.emitProgress(item);
    } catch (err: any) {
      if ((item.status as string) !== 'cancelled' && (item.status as string) !== 'paused') {
        item.status = 'failed';
        item.error = err.message || 'Download failed';
        this.emitProgress(item);
      }
    } finally {
      this.abortControllers.delete(item.id);
    }
  }

  public pauseTransfer(id: string): boolean {
    const item = this.transfers.get(id);
    if (!item || item.status !== 'running') return false;

    item.status = 'paused';
    item.speed = 0;
    const ctrl = this.abortControllers.get(id);
    if (ctrl) ctrl.abort();
    this.emitProgress(item);
    return true;
  }

  public resumeTransfer(id: string): boolean {
    const item = this.transfers.get(id);
    if (!item || item.status !== 'paused') return false;

    item.status = 'queued';
    this.emitProgress(item);
    return true;
  }

  public cancelTransfer(id: string): boolean {
    const item = this.transfers.get(id);
    if (!item) return false;

    item.status = 'cancelled';
    item.speed = 0;
    const ctrl = this.abortControllers.get(id);
    if (ctrl) ctrl.abort();
    this.emitProgress(item);
    return true;
  }

  public getTransfers(): TransferItem[] {
    return Array.from(this.transfers.values());
  }

  public clearFinished(): boolean {
    for (const [id, item] of this.transfers.entries()) {
      if (item.status === 'completed' || item.status === 'cancelled' || item.status === 'failed') {
        this.transfers.delete(id);
      }
    }
    return true;
  }
}

export const transferService = new TransferService();
