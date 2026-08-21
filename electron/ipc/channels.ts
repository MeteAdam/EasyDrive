export const IPC_CHANNELS = {
  // Auth channels
  AUTH_GET_STATUS: 'auth:get-status',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_SAVE_SETTINGS: 'auth:save-settings',
  AUTH_GET_SETTINGS: 'auth:get-settings',

  // Drive channels
  DRIVE_FETCH_ITEMS: 'drive:fetch-items',
  DRIVE_FETCH_FOLDER_TREE: 'drive:fetch-folder-tree',
  DRIVE_SEARCH: 'drive:search',
  DRIVE_CREATE_FOLDER: 'drive:create-folder',
  DRIVE_CREATE_FILE: 'drive:create-file',
  DRIVE_RENAME_ITEM: 'drive:rename-item',
  DRIVE_DELETE_ITEM: 'drive:delete-item',
  DRIVE_RESTORE_ITEM: 'drive:restore-item',
  DRIVE_MOVE_ITEM: 'drive:move-item',
  DRIVE_DUPLICATE_ITEM: 'drive:duplicate-item',
  DRIVE_TOGGLE_STAR: 'drive:toggle-star',
  DRIVE_GET_QUOTA: 'drive:get-quota',
  DRIVE_SYNC_CHANGES: 'drive:sync-changes',
  DRIVE_GET_DB_STATS: 'drive:get-db-stats',
  DRIVE_CLEAR_CACHE: 'drive:clear-cache',
  DRIVE_FETCH_TRASH: 'drive:fetch-trash',
  DRIVE_EMPTY_TRASH: 'drive:empty-trash',

  // Transfer channels
  TRANSFER_UPLOAD_FILES: 'transfer:upload-files',
  TRANSFER_UPLOAD_DIRECTORY: 'transfer:upload-directory',
  TRANSFER_DOWNLOAD_ITEM: 'transfer:download-item',
  TRANSFER_PAUSE: 'transfer:pause',
  TRANSFER_RESUME: 'transfer:resume',
  TRANSFER_CANCEL: 'transfer:cancel',
  TRANSFER_GET_ALL: 'transfer:get-all',
  TRANSFER_CLEAR_FINISHED: 'transfer:clear-finished',
  TRANSFER_PROGRESS_EVENT: 'transfer:progress-event',

  // System channels
  SYSTEM_SHOW_IN_FOLDER: 'system:show-in-folder',
  SYSTEM_OPEN_EXTERNAL: 'system:open-external',
  SYSTEM_SELECT_FILES: 'system:select-files',
  SYSTEM_SELECT_DIRECTORY: 'system:select-directory',
  SYSTEM_SELECT_SAVE_PATH: 'system:select-save-path',
  SYSTEM_CLIPBOARD_WRITE: 'system:clipboard-write',
} as const;
