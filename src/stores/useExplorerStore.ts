import { create } from 'zustand';
import type { 
  DriveItem, 
  DriveFolder, 
  BreadcrumbNode, 
  ViewMode, 
  SortField, 
  SortDirection, 
  QuickAccessView, 
  FileCategory 
} from '../types/drive';

interface NavigationEntry {
  folderId: string;
  folderName: string;
  view: QuickAccessView;
}

interface ExplorerState {
  currentFolderId: string;
  currentFolderName: string;
  currentView: QuickAccessView;
  breadcrumbs: BreadcrumbNode[];
  items: DriveItem[];
  folderTree: DriveFolder[];
  selectedIds: string[];
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  filterCategory: FileCategory;
  filterStarred: boolean;
  isLoading: boolean;

  // History for Back / Forward
  history: NavigationEntry[];
  historyIndex: number;

  // Modals
  isNewFolderOpen: boolean;
  isNewFileOpen: boolean;
  isMoveOpen: boolean;
  propertiesItem: DriveItem | null;
  inlineRenameId: string | null;

  // Actions
  loadFolderTree: () => Promise<void>;
  loadItems: (forceSync?: boolean) => Promise<void>;
  navigateToFolder: (folderId: string, folderName?: string, pushHistory?: boolean) => Promise<void>;
  navigateToView: (view: QuickAccessView, pushHistory?: boolean) => Promise<void>;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateUp: () => void;
  refresh: () => Promise<void>;

  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: FileCategory) => void;
  setFilterStarred: (starred: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSorting: (field: SortField) => void;

  setSelectedIds: (ids: string[]) => void;
  selectItem: (id: string, isCtrl?: boolean, isShift?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  setNewFolderOpen: (open: boolean) => void;
  setNewFileOpen: (open: boolean) => void;
  setMoveOpen: (open: boolean) => void;
  setPropertiesItem: (item: DriveItem | null) => void;
  setInlineRenameId: (id: string | null) => void;

  createFolder: (name: string) => Promise<DriveItem | null>;
  createFile: (name: string, content?: string) => Promise<DriveItem | null>;
  renameItem: (id: string, newName: string) => Promise<DriveItem | null>;
  deleteSelected: (permanent?: boolean) => Promise<void>;
  restoreSelected: () => Promise<void>;
  emptyTrash: () => Promise<void>;
  moveSelected: (newParentId: string) => Promise<void>;
  duplicateSelected: () => Promise<void>;
  toggleStarSelected: () => Promise<void>;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  currentFolderId: 'root',
  currentFolderName: 'My Drive',
  currentView: 'my-drive',
  breadcrumbs: [{ id: 'root', name: 'My Drive' }],
  items: [],
  folderTree: [],
  selectedIds: [],
  viewMode: 'grid',
  sortField: 'name',
  sortDirection: 'asc',
  searchQuery: '',
  filterCategory: 'all',
  filterStarred: false,
  isLoading: false,

  history: [{ folderId: 'root', folderName: 'My Drive', view: 'my-drive' }],
  historyIndex: 0,

  isNewFolderOpen: false,
  isNewFileOpen: false,
  isMoveOpen: false,
  propertiesItem: null,
  inlineRenameId: null,

  loadFolderTree: async () => {
    if (!window.electronAPI) return;
    try {
      const tree = await window.electronAPI.drive.fetchFolderTree();
      set({ folderTree: tree });
    } catch (e) {
      console.error('[useExplorerStore] loadFolderTree error:', e);
    }
  },

  loadItems: async (forceSync = false) => {
    if (!window.electronAPI) return;
    set({ isLoading: true });
    try {
      const { currentFolderId, currentView, searchQuery, filterCategory, filterStarred } = get();
      let fetched: DriveItem[] = [];

      if (searchQuery.trim()) {
        fetched = await window.electronAPI.drive.search(searchQuery, {
          category: filterCategory,
          starredOnly: filterStarred,
          trashed: currentView === 'trash',
        });
      } else {
        if (currentView === 'my-drive') {
          fetched = await window.electronAPI.drive.fetchItems(currentFolderId, forceSync);
        } else if (currentView === 'starred') {
          const all = await window.electronAPI.drive.search('', { starredOnly: true, trashed: false });
          fetched = all;
        } else if (currentView === 'recent') {
          const all = await window.electronAPI.drive.search('', { trashed: false });
          fetched = all.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
        } else if (currentView === 'trash') {
          fetched = await window.electronAPI.drive.fetchTrashItems(forceSync);
        } else if (currentView === 'backups') {
          const all = await window.electronAPI.drive.fetchItems('folder-backups', forceSync);
          fetched = all;
        }
      }

      set({ items: fetched, isLoading: false });
    } catch (e) {
      console.error('[useExplorerStore] loadItems error:', e);
      set({ isLoading: false });
    }
  },

  navigateToFolder: async (folderId, folderName, pushHistory = true) => {
    const { history, historyIndex, breadcrumbs } = get();
    const finalName = folderName || (folderId === 'root' ? 'My Drive' : 'Folder');

    let newBreadcrumbs = [...breadcrumbs];
    if (folderId === 'root') {
      newBreadcrumbs = [{ id: 'root', name: 'My Drive' }];
    } else {
      const existingIdx = newBreadcrumbs.findIndex(b => b.id === folderId);
      if (existingIdx !== -1) {
        newBreadcrumbs = newBreadcrumbs.slice(0, existingIdx + 1);
      } else {
        newBreadcrumbs.push({ id: folderId, name: finalName });
      }
    }

    const newEntry: NavigationEntry = { folderId, folderName: finalName, view: 'my-drive' };
    let newHistory = history;
    let newIndex = historyIndex;

    if (pushHistory) {
      newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newEntry);
      newIndex = newHistory.length - 1;
    }

    set({
      currentFolderId: folderId,
      currentFolderName: finalName,
      currentView: 'my-drive',
      breadcrumbs: newBreadcrumbs,
      selectedIds: [],
      searchQuery: '',
      history: newHistory,
      historyIndex: newIndex,
    });

    await get().loadItems();
    await get().loadFolderTree();
  },

  navigateToView: async (view, pushHistory = true) => {
    const { history, historyIndex } = get();
    const viewNames: Record<QuickAccessView, string> = {
      'my-drive': 'My Drive',
      'starred': 'Starred',
      'recent': 'Recent Files',
      'trash': 'Trash',
      'backups': 'Local Backups',
    };

    const name = viewNames[view];
    const newEntry: NavigationEntry = { folderId: 'root', folderName: name, view };
    let newHistory = history;
    let newIndex = historyIndex;

    if (pushHistory) {
      newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newEntry);
      newIndex = newHistory.length - 1;
    }

    set({
      currentFolderId: 'root',
      currentFolderName: name,
      currentView: view,
      breadcrumbs: [{ id: 'root', name }],
      selectedIds: [],
      searchQuery: '',
      history: newHistory,
      historyIndex: newIndex,
    });

    await get().loadItems();
  },

  navigateBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const entry = history[prevIndex];
      set({ historyIndex: prevIndex });
      if (entry.view === 'my-drive') {
        get().navigateToFolder(entry.folderId, entry.folderName, false);
      } else {
        get().navigateToView(entry.view, false);
      }
    }
  },

  navigateForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const entry = history[nextIndex];
      set({ historyIndex: nextIndex });
      if (entry.view === 'my-drive') {
        get().navigateToFolder(entry.folderId, entry.folderName, false);
      } else {
        get().navigateToView(entry.view, false);
      }
    }
  },

  navigateUp: () => {
    const { breadcrumbs } = get();
    if (breadcrumbs.length > 1) {
      const parentNode = breadcrumbs[breadcrumbs.length - 2];
      get().navigateToFolder(parentNode.id, parentNode.name);
    }
  },

  refresh: async () => {
    await get().loadItems(true);
    await get().loadFolderTree();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().loadItems();
  },

  setFilterCategory: (category) => {
    set({ filterCategory: category });
    get().loadItems();
  },

  setFilterStarred: (starred) => {
    set({ filterStarred: starred });
    get().loadItems();
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSorting: (field) => {
    const { sortField, sortDirection } = get();
    if (sortField === field) {
      set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortField: field, sortDirection: 'asc' });
    }
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectItem: (id, isCtrl = false, isShift = false) => {
    const { items, selectedIds } = get();

    if (isShift && selectedIds.length > 0) {
      const lastSelected = selectedIds[selectedIds.length - 1];
      const lastIndex = items.findIndex(i => i.id === lastSelected);
      const currentIndex = items.findIndex(i => i.id === id);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = items.slice(start, end + 1).map(i => i.id);
        const merged = Array.from(new Set([...selectedIds, ...rangeIds]));
        set({ selectedIds: merged });
        return;
      }
    }

    if (isCtrl) {
      if (selectedIds.includes(id)) {
        set({ selectedIds: selectedIds.filter(i => i !== id) });
      } else {
        set({ selectedIds: [...selectedIds, id] });
      }
      return;
    }

    // Default single selection
    set({ selectedIds: [id] });
  },

  selectAll: () => {
    const { items } = get();
    set({ selectedIds: items.map(i => i.id) });
  },

  clearSelection: () => set({ selectedIds: [] }),

  setNewFolderOpen: (open) => set({ isNewFolderOpen: open }),
  setNewFileOpen: (open) => set({ isNewFileOpen: open }),
  setMoveOpen: (open) => set({ isMoveOpen: open }),
  setPropertiesItem: (item) => set({ propertiesItem: item }),
  setInlineRenameId: (id) => set({ inlineRenameId: id }),

  createFolder: async (name) => {
    if (!window.electronAPI) return null;
    try {
      const { currentFolderId } = get();
      const folder = await window.electronAPI.drive.createFolder(name, currentFolderId);
      await get().refresh();
      return folder;
    } catch (e) {
      console.error('[useExplorerStore] createFolder error:', e);
      return null;
    }
  },

  createFile: async (name, content = '') => {
    if (!window.electronAPI) return null;
    try {
      const { currentFolderId } = get();
      const file = await window.electronAPI.drive.createFile(name, content, currentFolderId);
      await get().refresh();
      return file;
    } catch (e) {
      console.error('[useExplorerStore] createFile error:', e);
      return null;
    }
  },

  renameItem: async (id, newName) => {
    if (!window.electronAPI) return null;
    try {
      const updated = await window.electronAPI.drive.renameItem(id, newName);
      await get().refresh();
      return updated;
    } catch (e) {
      console.error('[useExplorerStore] renameItem error:', e);
      return null;
    }
  },

  deleteSelected: async (permanent = false) => {
    if (!window.electronAPI) return;
    const { selectedIds, currentView } = get();
    const isPermanent = permanent || currentView === 'trash';
    try {
      await Promise.all(selectedIds.map(id => window.electronAPI.drive.deleteItem(id, isPermanent)));
      set({ selectedIds: [] });
      await get().refresh();
    } catch (e) {
      console.error('[useExplorerStore] deleteSelected error:', e);
    }
  },

  restoreSelected: async () => {
    if (!window.electronAPI) return;
    const { selectedIds } = get();
    try {
      await Promise.all(selectedIds.map(id => window.electronAPI.drive.restoreItem(id)));
      set({ selectedIds: [] });
      await get().refresh();
    } catch (e) {
      console.error('[useExplorerStore] restoreSelected error:', e);
    }
  },

  emptyTrash: async () => {
    if (!window.electronAPI) return;
    try {
      set({ isLoading: true });
      await window.electronAPI.drive.emptyTrash();
      set({ selectedIds: [], items: [], isLoading: false });
      await get().refresh();
    } catch (e) {
      console.error('[useExplorerStore] emptyTrash error:', e);
      set({ isLoading: false });
    }
  },

  moveSelected: async (newParentId) => {
    if (!window.electronAPI) return;
    const { selectedIds, currentFolderId } = get();
    try {
      await Promise.all(selectedIds.map(id => window.electronAPI.drive.moveItem(id, newParentId, currentFolderId)));
      set({ selectedIds: [], isMoveOpen: false });
      await get().refresh();
    } catch (e) {
      console.error('[useExplorerStore] moveSelected error:', e);
    }
  },

  duplicateSelected: async () => {
    if (!window.electronAPI) return;
    const { selectedIds } = get();
    try {
      await Promise.all(selectedIds.map(id => window.electronAPI.drive.duplicateItem(id)));
      await get().refresh();
    } catch (e) {
      console.error('[useExplorerStore] duplicateSelected error:', e);
    }
  },

  toggleStarSelected: async () => {
    if (!window.electronAPI) return;
    const { selectedIds, items } = get();
    try {
      for (const id of selectedIds) {
        const item = items.find(i => i.id === id);
        if (item) {
          await window.electronAPI.drive.toggleStar(id, !item.starred);
        }
      }
      await get().refresh();
    } catch (e) {
      console.error('[useExplorerStore] toggleStarSelected error:', e);
    }
  },
}));
