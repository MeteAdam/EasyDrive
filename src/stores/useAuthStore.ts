import { create } from 'zustand';
import type { AuthStatus, StorageQuota, AppSettings } from '../types/drive';

interface AuthState {
  status: AuthStatus;
  quota: StorageQuota;
  settings: AppSettings;
  isLoading: boolean;
  isSettingsOpen: boolean;
  initAuth: () => Promise<void>;
  login: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadQuota: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  setSettingsOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: {
    isAuthenticated: false,
    hasCredentials: false,
  },
  quota: {
    limit: 0,
    usage: 0,
    usageInDrive: 0,
    usageInTrash: 0,
    userDisplayName: '',
    userEmail: '',
  },
  settings: {
    clientId: '',
    clientSecret: '',
    syncIntervalMinutes: 5,
    maxConcurrentTransfers: 3,
    defaultDownloadPath: '',
    enableLocalCache: true,
    port: 8585,
  },
  isLoading: true,
  isSettingsOpen: false,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const [status, settings, quota] = await Promise.all([
          window.electronAPI.auth.getStatus(),
          window.electronAPI.auth.getSettings(),
          window.electronAPI.drive.getQuota(),
        ]);
        set({ status, settings, quota, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('[useAuthStore] initAuth error:', e);
      set({ isLoading: false });
    }
  },

  login: async () => {
    if (!window.electronAPI) return { success: false, error: 'Electron API unavailable' };
    const res = await window.electronAPI.auth.login();
    if (res.success) {
      await get().initAuth();
    }
    return res;
  },

  logout: async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.auth.logout();
    await get().initAuth();
  },

  loadQuota: async () => {
    if (!window.electronAPI) return;
    const quota = await window.electronAPI.drive.getQuota();
    set({ quota });
  },

  loadSettings: async () => {
    if (!window.electronAPI) return;
    const settings = await window.electronAPI.auth.getSettings();
    set({ settings });
  },

  updateSettings: async (newSettings) => {
    if (!window.electronAPI) return false;
    const res = await window.electronAPI.auth.saveSettings(newSettings);
    if (res.success) {
      await get().loadSettings();
    }
    return res.success;
  },

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
