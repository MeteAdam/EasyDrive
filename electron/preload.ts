import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';
import type { IElectronAPI } from '../src/types/electron';
import type { TransferItem, AppSettings, FilterOptions } from '../src/types/drive';

const electronAPI: IElectronAPI = {
  auth: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_STATUS),
    login: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
    saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SAVE_SETTINGS, settings),
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_SETTINGS),
  },
  drive: {
    fetchItems: (parentId?: string | null, forceSync?: boolean) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_FETCH_ITEMS, parentId, forceSync),
    fetchFolderTree: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_FETCH_FOLDER_TREE),
    search: (query: string, filters?: FilterOptions) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_SEARCH, query, filters),
    createFolder: (name: string, parentId?: string | null) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_CREATE_FOLDER, name, parentId),
    createFile: (name: string, content?: string, parentId?: string | null) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_CREATE_FILE, name, content, parentId),
    renameItem: (id: string, newName: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_RENAME_ITEM, id, newName),
    deleteItem: (id: string, permanent?: boolean) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_DELETE_ITEM, id, permanent),
    restoreItem: (id: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_RESTORE_ITEM, id),
    moveItem: (id: string, newParentId: string, oldParentId?: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_MOVE_ITEM, id, newParentId, oldParentId),
    duplicateItem: (id: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_DUPLICATE_ITEM, id),
    toggleStar: (id: string, starred: boolean) => 
      ipcRenderer.invoke(IPC_CHANNELS.DRIVE_TOGGLE_STAR, id, starred),
    getQuota: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_GET_QUOTA),
    syncChanges: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_SYNC_CHANGES),
    getDatabaseStats: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_GET_DB_STATS),
    clearLocalCache: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_CLEAR_CACHE),
    fetchTrashItems: (forceSync?: boolean) => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_FETCH_TRASH, forceSync),
    emptyTrash: () => ipcRenderer.invoke(IPC_CHANNELS.DRIVE_EMPTY_TRASH),
  },
  transfers: {
    uploadFiles: (filePaths: string[], destinationFolderId?: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_UPLOAD_FILES, filePaths, destinationFolderId),
    uploadDirectory: (dirPath: string, destinationFolderId?: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_UPLOAD_DIRECTORY, dirPath, destinationFolderId),
    downloadItem: (driveItemId: string, destinationDirectory?: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_DOWNLOAD_ITEM, driveItemId, destinationDirectory),
    pauseTransfer: (id: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_PAUSE, id),
    resumeTransfer: (id: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_RESUME, id),
    cancelTransfer: (id: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_CANCEL, id),
    getTransfers: () => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_GET_ALL),
    clearFinishedTransfers: () => 
      ipcRenderer.invoke(IPC_CHANNELS.TRANSFER_CLEAR_FINISHED),
    onTransferProgress: (callback: (transfer: TransferItem) => void) => {
      const listener = (_: any, transfer: TransferItem) => callback(transfer);
      ipcRenderer.on(IPC_CHANNELS.TRANSFER_PROGRESS_EVENT, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TRANSFER_PROGRESS_EVENT, listener);
      };
    },
  },
  system: {
    showItemInFolder: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, path),
    openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, url),
    selectFiles: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_FILES),
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_DIRECTORY),
    selectSavePath: (defaultName: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_SAVE_PATH, defaultName),
    clipboardWriteText: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_CLIPBOARD_WRITE, text),
  },
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('[Preload] EasyDrive electronAPI successfully exposed to window');
} catch (err) {
  console.error('[Preload] Failed to expose electronAPI:', err);
}
