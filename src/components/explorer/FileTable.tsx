import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive, 
  Code2, 
  FileSpreadsheet, 
  File, 
  Star, 
  ArrowUp, 
  ArrowDown,
  Cloud,
  LogIn,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import type { DriveItem, SortField } from '../../types/drive';

interface FileTableProps {
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
}

export const FileTable: React.FC<FileTableProps> = ({ onContextMenu }) => {
  const {
    items,
    currentView,
    selectedIds,
    inlineRenameId,
    sortField,
    sortDirection,
    selectItem,
    navigateToFolder,
    renameItem,
    setInlineRenameId,
    setSorting,
    setPropertiesItem,
    emptyTrash,
    refresh,
  } = useExplorerStore();

  const { status, setSettingsOpen, login } = useAuthStore();
  const { handleDrop } = useDragAndDrop();
  const [renameText, setRenameText] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inlineRenameId) {
      const item = items.find((i) => i.id === inlineRenameId);
      if (item) {
        setRenameText(item.name);
        setTimeout(() => {
          if (renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
          }
        }, 50);
      }
    }
  }, [inlineRenameId, items]);

  const handleFinishRename = async () => {
    if (inlineRenameId && renameText.trim()) {
      await renameItem(inlineRenameId, renameText.trim());
    }
    setInlineRenameId(null);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (item: DriveItem) => {
    if (item.isFolder) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />;
    }
    const mime = (item.mimeType || '').toLowerCase();
    const ext = item.name.split('.').pop()?.toLowerCase() || '';

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      return <Video className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext)) {
      return <Music className="w-4 h-4 text-pink-400 shrink-0" />;
    }
    if (mime.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (mime.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (mime.includes('zip') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <Archive className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (mime.includes('json') || ['js', 'ts', 'tsx', 'py', 'sql', 'html', 'css'].includes(ext)) {
      return <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-zinc-400 shrink-0" />;
  };

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 inline ml-1" />
    );
  };

  // 1. Unauthenticated Welcome State
  if (!status.isAuthenticated && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] h-full p-8 text-center select-none animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-5">
          <Cloud className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">
          Welcome to EasyDrive
        </h2>
        <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
          Manage your Google Drive cloud storage with native Windows Explorer speed. Connect your Google account to explore and synchronize your files.
        </p>

        {/* Call to Action */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            <span>Connect Google Account (OAuth 2.0)</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-3 max-w-lg w-full text-left">
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-1.5">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">SQLite Indexing</p>
            <p className="text-[10px] text-zinc-500">Sub-millisecond instant search and navigation</p>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-1.5">
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">Resumable Uploads</p>
            <p className="text-[10px] text-zinc-500">Chunked upload streams supporting files over 10GB</p>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-1.5">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">Secure Storage</p>
            <p className="text-[10px] text-zinc-500">Local token encryption via Electron safeStorage</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (items.length === 0) {
    if (currentView === 'trash') {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-zinc-500 gap-3 select-none animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-750 flex items-center justify-center text-zinc-600">
            <Trash2 className="w-8 h-8 text-rose-500/50" />
          </div>
          <p className="text-sm font-medium text-zinc-300">Trash is empty</p>
          <p className="text-xs text-zinc-500">Deleted items and folders will appear here</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-zinc-500 gap-3 select-none animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-750 flex items-center justify-center text-zinc-600">
          <Folder className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-zinc-300">This folder is empty</p>
        <p className="text-xs text-zinc-500">Drag files here from Windows Explorer or right-click to upload</p>
      </div>
    );
  }

  // Sort items client-side for immediate responsive feel
  const sortedItems = [...items].sort((a, b) => {
    // Folders always at top
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;

    let res = 0;
    if (sortField === 'name') {
      res = a.name.localeCompare(b.name);
    } else if (sortField === 'modifiedTime') {
      res = new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime();
    } else if (sortField === 'size') {
      res = (a.size || 0) - (b.size || 0);
    } else if (sortField === 'mimeType') {
      res = a.mimeType.localeCompare(b.mimeType);
    }
    return sortDirection === 'asc' ? res : -res;
  });

  return (
    <div className="w-full text-xs select-none">
      {/* Trash View Info Banner */}
      {currentView === 'trash' && (
        <div className="bg-rose-950/40 border-b border-rose-900/50 px-4 py-2 flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs">Items in Trash will be permanently deleted when removed.</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently delete all items in Trash?')) {
                emptyTrash();
              }
            }}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold text-[11px] transition-colors"
          >
            Empty Trash Now
          </button>
        </div>
      )}

      {/* Table Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-750 flex items-center px-4 py-2 text-[11px] font-semibold text-zinc-400 z-10">
        <div
          className="flex-[3] flex items-center cursor-pointer hover:text-zinc-200 transition-colors"
          onClick={() => setSorting('name')}
        >
          <span>Name</span>
          {renderSortArrow('name')}
        </div>
        <div
          className="flex-[2] flex items-center cursor-pointer hover:text-zinc-200 transition-colors"
          onClick={() => setSorting('modifiedTime')}
        >
          <span>Date Modified</span>
          {renderSortArrow('modifiedTime')}
        </div>
        <div
          className="flex-[1.5] flex items-center cursor-pointer hover:text-zinc-200 transition-colors"
          onClick={() => setSorting('mimeType')}
        >
          <span>Type</span>
          {renderSortArrow('mimeType')}
        </div>
        <div
          className="flex-[1] flex items-center justify-end cursor-pointer hover:text-zinc-200 transition-colors pr-2"
          onClick={() => setSorting('size')}
        >
          <span>Size</span>
          {renderSortArrow('size')}
        </div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col py-1">
        {sortedItems.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const isRenaming = inlineRenameId === item.id;

          return (
            <div
              key={item.id}
              data-selectable="true"
              data-id={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'drive-item-move', itemId: item.id }));
              }}
              onDragOver={(e) => {
                if (item.isFolder) {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-blue-600/30', 'text-blue-200');
                }
              }}
              onDragLeave={(e) => {
                if (item.isFolder) {
                  e.currentTarget.classList.remove('bg-blue-600/30', 'text-blue-200');
                }
              }}
              onDrop={(e) => {
                if (item.isFolder) {
                  e.currentTarget.classList.remove('bg-blue-600/30', 'text-blue-200');
                  handleDrop(e, item.id);
                }
              }}
              onClick={(e) => selectItem(item.id, e.ctrlKey || e.metaKey, e.shiftKey)}
              onDoubleClick={() => {
                if (item.isFolder) {
                  navigateToFolder(item.id, item.name);
                } else {
                  setPropertiesItem(item);
                }
              }}
              onContextMenu={(e) => {
                if (!isSelected) selectItem(item.id);
                onContextMenu(e, item);
              }}
              className={`flex items-center px-4 py-1.5 cursor-pointer transition-colors border-b border-zinc-800/40 ${
                isSelected
                  ? 'bg-blue-600/20 text-blue-300 font-medium'
                  : 'hover:bg-zinc-850/80 text-zinc-300 hover:text-zinc-100'
              }`}
            >
              {/* Name column */}
              <div className="flex-[3] flex items-center gap-2.5 min-w-0 pr-4">
                {getFileIcon(item)}
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') setInlineRenameId(null);
                    }}
                    className="flex-1 bg-zinc-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none select-text"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="truncate font-medium flex items-center gap-1.5">
                    {item.name}
                    {item.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                  </span>
                )}
              </div>

              {/* Date modified */}
              <div className="flex-[2] text-zinc-400 text-[11px] truncate">
                {formatDate(item.modifiedTime)}
              </div>

              {/* MIME Type / File Extension */}
              <div className="flex-[1.5] text-zinc-500 text-[11px] truncate capitalize">
                {item.isFolder ? 'Folder' : (item.name.split('.').pop()?.toUpperCase() || 'File')}
              </div>

              {/* File Size */}
              <div className="flex-[1] text-zinc-400 text-[11px] text-right pr-2">
                {item.isFolder ? '--' : formatBytes(item.size)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
