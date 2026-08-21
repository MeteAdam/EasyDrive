import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  RotateCw, 
  Search, 
  LayoutGrid, 
  List, 
  Settings, 
  ArrowUpDown, 
  Database,
  Star,
  FileText,
  Image as ImageIcon,
  Video,
  Code2,
  HardDrive,
  Trash2
} from 'lucide-react';
import { Breadcrumb } from '../explorer/Breadcrumb';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTransferStore } from '../../stores/useTransferStore';
import type { FileCategory, SortField } from '../../types/drive';

export const TopNav: React.FC = () => {
  const {
    history,
    historyIndex,
    breadcrumbs,
    currentView,
    items,
    viewMode,
    sortField,
    sortDirection,
    searchQuery,
    filterCategory,
    filterStarred,
    navigateBack,
    navigateForward,
    navigateUp,
    refresh,
    emptyTrash,
    setViewMode,
    setSorting,
    setSearchQuery,
    setFilterCategory,
    setFilterStarred,
    isLoading,
  } = useExplorerStore();

  const { quota, setSettingsOpen, status } = useAuthStore();
  const { isDrawerOpen, toggleDrawer, activeCount } = useTransferStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoUp = breadcrumbs.length > 1;

  // Format Storage Quota
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 GB';
    const tb = bytes / (1024 * 1024 * 1024 * 1024);
    if (tb >= 1) return `${tb.toFixed(2)} TB`;
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const usagePercent = Math.min(100, Math.round((quota.usage / (quota.limit || 5497558138880)) * 100));

  const filterButtons: { id: FileCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Database },
    { id: 'documents', label: 'Docs', icon: FileText },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'videos', label: 'Video', icon: Video },
    { id: 'code', label: 'Code', icon: Code2 },
  ];

  return (
    <header className="h-[52px] bg-zinc-900 border-b border-zinc-750 px-4 flex items-center justify-between gap-3 select-none shrink-0 z-30">
      {/* Navigation Controls & Breadcrumbs */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-750 shrink-0">
          <button
            onClick={navigateBack}
            disabled={!canGoBack}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Back (Alt+Left)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={navigateForward}
            disabled={!canGoForward}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Forward (Alt+Right)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={navigateUp}
            disabled={!canGoUp}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Up One Level (Alt+Up)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={refresh}
            className={`p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${
              isLoading ? 'animate-spin text-blue-400' : ''
            }`}
            title="Refresh (F5)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Clickable Breadcrumbs */}
        <Breadcrumb />
      </div>

      {/* Instant Search Bar & Filter Badges */}
      <div className="flex items-center gap-2 max-w-md w-full">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Sub-millisecond instant search (files, paths, types)..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-750 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Starred Filter Badge */}
        <button
          onClick={() => setFilterStarred(!filterStarred)}
          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
            filterStarred
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-zinc-950 border-zinc-750 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Filter Starred Items"
        >
          <Star className={`w-3.5 h-3.5 ${filterStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Storage Quota Gauge & View / Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Storage Quota Pill */}
        <div
          onClick={() => setSettingsOpen(true)}
          className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 bg-zinc-950 border border-zinc-750 hover:border-zinc-600 rounded-lg transition-colors group"
          title={
            status.isAuthenticated
              ? `Google Drive Storage: ${formatBytes(quota.usage)} / ${formatBytes(quota.limit)} (${usagePercent}%)`
              : 'Google Drive Account Not Connected - Click to Connect'
          }
        >
          <HardDrive className={`w-3.5 h-3.5 ${status.isAuthenticated ? 'text-blue-400' : 'text-zinc-500'} group-hover:scale-110 transition-transform`} />
          {status.isAuthenticated && quota.limit > 0 ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400">
                <span className="font-semibold text-zinc-200">{formatBytes(quota.usage)}</span>
                <span>{formatBytes(quota.limit)}</span>
              </div>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.max(4, usagePercent)}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-blue-400 transition-colors">
              Not Connected (Sign In)
            </span>
          )}
        </div>

        {/* Empty Trash Button (when viewing Trash) */}
        {currentView === 'trash' && items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently delete all items in Trash? This cannot be undone.')) {
                emptyTrash();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
            title="Permanently empty all items from Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-750">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-blue-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === 'table'
                ? 'bg-zinc-800 text-blue-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Detailed Table View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Settings Dialog Trigger */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 bg-zinc-950 border border-zinc-750 hover:border-zinc-600 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          title="Drive & OAuth Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
