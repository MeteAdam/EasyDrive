import { 
  DriveItem, 
  DriveFolder, 
  StorageQuota, 
  AuthStatus, 
  TransferItem, 
  AppSettings, 
  FilterOptions 
} from './drive';

export interface IElectronAPI {
  // Auth API
  auth: {
    getStatus: () => Promise<AuthStatus>;
    login: () => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<{ success: boolean }>;
    saveSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
    getSettings: () => Promise<AppSettings>;
  };

  // Drive operations
  drive: {
    fetchItems: (parentId?: string | null, forceSync?: boolean) => Promise<DriveItem[]>;
    fetchFolderTree: () => Promise<DriveFolder[]>;
    search: (query: string, filters?: FilterOptions) => Promise<DriveItem[]>;
    createFolder: (name: string, parentId?: string | null) => Promise<DriveItem>;
    createFile: (name: string, content?: string, parentId?: string | null) => Promise<DriveItem>;
    renameItem: (id: string, newName: string) => Promise<DriveItem>;
    deleteItem: (id: string, permanent?: boolean) => Promise<boolean>;
    restoreItem: (id: string) => Promise<boolean>;
    moveItem: (id: string, newParentId: string, oldParentId?: string) => Promise<DriveItem>;
    duplicateItem: (id: string) => Promise<DriveItem>;
    toggleStar: (id: string, starred: boolean) => Promise<boolean>;
    getQuota: () => Promise<StorageQuota>;
    syncChanges: () => Promise<{ added: number; updated: number; deleted: number }>;
    getDatabaseStats: () => Promise<{ totalItems: number; totalFolders: number; totalFiles: number; dbSizeBytes: number }>;
    clearLocalCache: () => Promise<boolean>;
    fetchTrashItems: (forceSync?: boolean) => Promise<DriveItem[]>;
    emptyTrash: () => Promise<boolean>;
  };

  // File Transfers
  transfers: {
    uploadFiles: (filePaths: string[], destinationFolderId?: string) => Promise<TransferItem[]>;
    uploadDirectory: (directoryPath: string, destinationFolderId?: string) => Promise<TransferItem[]>;
    downloadItem: (driveItemId: string, destinationDirectory?: string) => Promise<TransferItem>;
    pauseTransfer: (transferId: string) => Promise<boolean>;
    resumeTransfer: (transferId: string) => Promise<boolean>;
    cancelTransfer: (transferId: string) => Promise<boolean>;
    getTransfers: () => Promise<TransferItem[]>;
    clearFinishedTransfers: () => Promise<boolean>;
    onTransferProgress: (callback: (transfer: TransferItem) => void) => () => void;
  };

  // System & Dialogs
  system: {
    showItemInFolder: (path: string) => Promise<void>;
    openExternal: (url: string) => Promise<void>;
    selectFiles: () => Promise<string[] | null>;
    selectDirectory: () => Promise<string | null>;
    selectSavePath: (defaultName: string) => Promise<string | null>;
    clipboardWriteText: (text: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
