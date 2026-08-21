export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  parentId?: string | null;
  size?: number; // in bytes
  modifiedTime: string; // ISO date string
  starred: boolean;
  trashed: boolean;
  isFolder: boolean;
  thumbnailLink?: string | null;
  webViewLink?: string | null;
  iconLink?: string | null;
  version?: string;
  md5Checksum?: string;
  owners?: { displayName: string; emailAddress: string; photoLink?: string }[];
  shared?: boolean;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string | null;
  hasChildren?: boolean;
  children?: DriveFolder[];
  isExpanded?: boolean;
}

export interface BreadcrumbNode {
  id: string;
  name: string;
  icon?: string;
}

export type ViewMode = 'grid' | 'table';

export type SortField = 'name' | 'modifiedTime' | 'size' | 'mimeType';
export type SortDirection = 'asc' | 'desc';

export type QuickAccessView = 'my-drive' | 'starred' | 'recent' | 'trash' | 'backups';

export type FileCategory = 'all' | 'documents' | 'images' | 'videos' | 'audio' | 'archives' | 'code';

export interface FilterOptions {
  category?: FileCategory;
  starredOnly?: boolean;
  trashed?: boolean;
  modifiedAfter?: string;
}

export type TransferType = 'upload' | 'download';
export type TransferStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface TransferItem {
  id: string;
  name: string;
  type: TransferType;
  totalBytes: number;
  transferredBytes: number;
  speed: number; // bytes per second
  progress: number; // 0 to 100
  eta: number; // seconds remaining
  status: TransferStatus;
  localPath: string;
  remoteId?: string;
  parentId?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface StorageQuota {
  limit: number; // total bytes (e.g., 5TB = 5497558138880 bytes)
  usage: number; // used bytes
  usageInDrive: number;
  usageInTrash: number;
  userDisplayName?: string;
  userEmail?: string;
  userPhotoLink?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  user?: {
    displayName: string;
    email: string;
    photoLink?: string;
  };
  hasCredentials: boolean;
}

export interface AppSettings {
  clientId: string;
  clientSecret: string;
  syncIntervalMinutes: number;
  maxConcurrentTransfers: number;
  defaultDownloadPath: string;
  enableLocalCache: boolean;
  port: number;
}
