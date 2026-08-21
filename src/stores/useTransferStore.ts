import { create } from 'zustand';
import type { TransferItem } from '../types/drive';

interface TransferState {
  transfers: TransferItem[];
  isDrawerOpen: boolean;
  activeCount: number;
  totalSpeed: number;

  initListener: () => () => void;
  loadTransfers: () => Promise<void>;
  uploadFiles: (filePaths: string[], destinationFolderId?: string) => Promise<void>;
  uploadDirectory: (dirPath: string, destinationFolderId?: string) => Promise<void>;
  downloadItem: (driveItemId: string, destinationDirectory?: string) => Promise<void>;
  pauseTransfer: (id: string) => Promise<void>;
  resumeTransfer: (id: string) => Promise<void>;
  cancelTransfer: (id: string) => Promise<void>;
  clearFinished: () => Promise<void>;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  isDrawerOpen: false,
  activeCount: 0,
  totalSpeed: 0,

  initListener: () => {
    if (!window.electronAPI) return () => {};

    // Initial load
    get().loadTransfers();

    const cleanup = window.electronAPI.transfers.onTransferProgress((updatedTransfer) => {
      set((state) => {
        const index = state.transfers.findIndex((t) => t.id === updatedTransfer.id);
        let updatedList: TransferItem[];

        if (index !== -1) {
          updatedList = [...state.transfers];
          updatedList[index] = updatedTransfer;
        } else {
          updatedList = [updatedTransfer, ...state.transfers];
        }

        const running = updatedList.filter((t) => t.status === 'running' || t.status === 'queued');
        const speed = updatedList.reduce((acc, t) => acc + (t.status === 'running' ? (t.speed || 0) : 0), 0);

        return {
          transfers: updatedList,
          activeCount: running.length,
          totalSpeed: speed,
        };
      });
    });

    return cleanup;
  },

  loadTransfers: async () => {
    if (!window.electronAPI) return;
    try {
      const list = await window.electronAPI.transfers.getTransfers();
      const running = list.filter((t) => t.status === 'running' || t.status === 'queued');
      const speed = list.reduce((acc, t) => acc + (t.status === 'running' ? (t.speed || 0) : 0), 0);
      set({ transfers: list, activeCount: running.length, totalSpeed: speed });
    } catch (e) {
      console.error('[useTransferStore] loadTransfers error:', e);
    }
  },

  uploadFiles: async (filePaths, destinationFolderId) => {
    if (!window.electronAPI || filePaths.length === 0) return;
    try {
      set({ isDrawerOpen: true });
      await window.electronAPI.transfers.uploadFiles(filePaths, destinationFolderId);
      await get().loadTransfers();
    } catch (e) {
      console.error('[useTransferStore] uploadFiles error:', e);
    }
  },

  uploadDirectory: async (dirPath, destinationFolderId) => {
    if (!window.electronAPI) return;
    try {
      set({ isDrawerOpen: true });
      await window.electronAPI.transfers.uploadDirectory(dirPath, destinationFolderId);
      await get().loadTransfers();
    } catch (e) {
      console.error('[useTransferStore] uploadDirectory error:', e);
    }
  },

  downloadItem: async (driveItemId, destinationDirectory) => {
    if (!window.electronAPI) return;
    try {
      set({ isDrawerOpen: true });
      await window.electronAPI.transfers.downloadItem(driveItemId, destinationDirectory);
      await get().loadTransfers();
    } catch (e) {
      console.error('[useTransferStore] downloadItem error:', e);
    }
  },

  pauseTransfer: async (id) => {
    if (!window.electronAPI) return;
    await window.electronAPI.transfers.pauseTransfer(id);
  },

  resumeTransfer: async (id) => {
    if (!window.electronAPI) return;
    await window.electronAPI.transfers.resumeTransfer(id);
  },

  cancelTransfer: async (id) => {
    if (!window.electronAPI) return;
    await window.electronAPI.transfers.cancelTransfer(id);
  },

  clearFinished: async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.transfers.clearFinishedTransfers();
    await get().loadTransfers();
  },

  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
}));
