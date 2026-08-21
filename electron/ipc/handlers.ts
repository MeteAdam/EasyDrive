import { ipcMain, dialog, shell, clipboard } from 'electron';
import { IPC_CHANNELS } from './channels';
import { authService } from '../services/auth.service';
import { driveService } from '../services/drive.service';
import { transferService } from '../services/transfer.service';
import { dbService } from '../services/db.service';
import type { AppSettings, FilterOptions } from '../../src/types/drive';

export function registerIpcHandlers() {
  // Auth Handlers
  ipcMain.handle(IPC_CHANNELS.AUTH_GET_STATUS, async () => {
    return authService.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async () => {
    return authService.login();
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async () => {
    return authService.logout();
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_SAVE_SETTINGS, async (_, settings: Partial<AppSettings>) => {
    const success = authService.saveSettings(settings);
    return { success };
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_SETTINGS, async () => {
    return authService.getSettings();
  });

  // Drive Handlers
  ipcMain.handle(IPC_CHANNELS.DRIVE_FETCH_ITEMS, async (_, parentId?: string | null, forceSync?: boolean) => {
    return driveService.fetchItems(parentId, forceSync);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_FETCH_FOLDER_TREE, async () => {
    return driveService.fetchFolderTree();
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_SEARCH, async (_, query: string, filters?: FilterOptions) => {
    return driveService.search(query, filters);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_CREATE_FOLDER, async (_, name: string, parentId?: string | null) => {
    return driveService.createFolder(name, parentId);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_CREATE_FILE, async (_, name: string, content?: string, parentId?: string | null) => {
    return driveService.createFile(name, content, parentId);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_RENAME_ITEM, async (_, id: string, newName: string) => {
    return driveService.renameItem(id, newName);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_DELETE_ITEM, async (_, id: string, permanent?: boolean) => {
    return driveService.deleteItem(id, permanent);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_RESTORE_ITEM, async (_, id: string) => {
    return driveService.restoreItem(id);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_MOVE_ITEM, async (_, id: string, newParentId: string, oldParentId?: string) => {
    return driveService.moveItem(id, newParentId, oldParentId);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_DUPLICATE_ITEM, async (_, id: string) => {
    return driveService.duplicateItem(id);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_TOGGLE_STAR, async (_, id: string, starred: boolean) => {
    return driveService.toggleStar(id, starred);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_GET_QUOTA, async () => {
    return driveService.getQuota();
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_SYNC_CHANGES, async () => {
    return driveService.syncChanges();
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_GET_DB_STATS, async () => {
    return dbService.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_CLEAR_CACHE, async () => {
    const success = dbService.clearCache();
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_FETCH_TRASH, async (_, forceSync?: boolean) => {
    return driveService.fetchTrashItems(forceSync);
  });

  ipcMain.handle(IPC_CHANNELS.DRIVE_EMPTY_TRASH, async () => {
    return driveService.emptyTrash();
  });

  // Transfer Handlers
  ipcMain.handle(IPC_CHANNELS.TRANSFER_UPLOAD_FILES, async (_, filePaths: string[], destinationFolderId?: string) => {
    return transferService.uploadFiles(filePaths, destinationFolderId);
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_UPLOAD_DIRECTORY, async (_, dirPath: string, destinationFolderId?: string) => {
    return transferService.uploadDirectory(dirPath, destinationFolderId);
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_DOWNLOAD_ITEM, async (_, driveItemId: string, destinationDirectory?: string) => {
    return transferService.downloadItem(driveItemId, destinationDirectory);
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_PAUSE, async (_, id: string) => {
    return transferService.pauseTransfer(id);
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_RESUME, async (_, id: string) => {
    return transferService.resumeTransfer(id);
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_CANCEL, async (_, id: string) => {
    return transferService.cancelTransfer(id);
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_GET_ALL, async () => {
    return transferService.getTransfers();
  });

  ipcMain.handle(IPC_CHANNELS.TRANSFER_CLEAR_FINISHED, async () => {
    return transferService.clearFinished();
  });

  // System & Dialogs
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, async (_, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, async (_, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_FILES, async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Select Files to Upload to Drive',
    });
    return res.canceled ? null : res.filePaths;
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_DIRECTORY, async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Folder to Upload or Download Location',
    });
    return res.canceled ? null : (res.filePaths[0] || null);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_SAVE_PATH, async (_, defaultName: string) => {
    const res = await dialog.showSaveDialog({
      defaultPath: defaultName,
      title: 'Save File',
    });
    return res.canceled ? null : (res.filePath || null);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_CLIPBOARD_WRITE, async (_, text: string) => {
    clipboard.writeText(text);
  });
}
