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
  CheckCircle2,
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
import type { DriveItem } from '../../types/drive';

interface FileGridProps {
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({ onContextMenu }) => {
  const {
    items,
    currentView,
    selectedIds,
    inlineRenameId,
    selectItem,
    navigateToFolder,
    renameItem,
    setInlineRenameId,
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

  const handleItemDoubleClick = (item: DriveItem) => {
    if (item.isFolder) {
      navigateToFolder(item.id, item.name);
    } else {
      setPropertiesItem(item);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (item: DriveItem) => {
    if (item.isFolder) {
      return <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20" />;
    }
    const mime = (item.mimeType || '').toLowerCase();
    const ext = item.name.split('.').pop()?.toLowerCase() || '';

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-10 h-10 text-emerald-400" />;
    }
    if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      return <Video className="w-10 h-10 text-purple-400" />;
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext)) {
      return <Music className="w-10 h-10 text-pink-400" />;
    }
    if (mime.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-10 h-10 text-rose-400" />;
    }
    if (mime.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-10 h-10 text-emerald-500" />;
    }
    if (mime.includes('zip') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <Archive className="w-10 h-10 text-amber-500" />;
    }
    if (mime.includes('json') || ['js', 'ts', 'tsx', 'py', 'sql', 'html', 'css'].includes(ext)) {
      return <Code2 className="w-10 h-10 text-cyan-400" />;
    }
    return <File className="w-10 h-10 text-zinc-400" />;
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

  // 3. Grid Items View
  return (
    <div className="flex flex-col">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
      {items.map((item) => {
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
                e.currentTarget.classList.add('ring-2', 'ring-blue-500', 'bg-blue-600/20');
              }
            }}
            onDragLeave={(e) => {
              if (item.isFolder) {
                e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-600/20');
              }
            }}
            onDrop={(e) => {
              if (item.isFolder) {
                e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-600/20');
                handleDrop(e, item.id);
              }
            }}
            onClick={(e) => selectItem(item.id, e.ctrlKey || e.metaKey, e.shiftKey)}
            onDoubleClick={() => handleItemDoubleClick(item)}
            onContextMenu={(e) => {
              if (!isSelected) selectItem(item.id);
              onContextMenu(e, item);
            }}
            className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-blue-600/15 border-blue-500/80 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50'
                : 'bg-zinc-900/80 border-zinc-750/70 hover:bg-zinc-850 hover:border-zinc-600'
            }`}
          >
            {/* Top Star & Selection Indicators */}
            <div className="w-full flex items-center justify-between gap-1 mb-2">
              <div className="w-4 h-4 flex items-center justify-center">
                {item.starred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
              </div>
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-zinc-700 group-hover:border-zinc-500 opacity-0 group-hover:opacity-100'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3 h-3" />}
              </div>
            </div>

            {/* Thumbnail Preview or Icon */}
            <div className="w-full h-20 flex items-center justify-center mb-2 overflow-hidden rounded-lg">
              {item.thumbnailLink ? (
                <img
                  src={item.thumbnailLink}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 group-hover:scale-105 transition-transform">
                  {getFileIcon(item)}
                </div>
              )}
            </div>

            {/* Name / In-place rename input */}
            <div className="w-full text-center">
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
                  className="w-full bg-zinc-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 text-center focus:outline-none select-text"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <p
                  className={`text-xs font-medium leading-tight line-clamp-2 break-all ${
                    isSelected ? 'text-blue-300 font-semibold' : 'text-zinc-200'
                  }`}
                  title={item.name}
                >
                  {item.name}
                </p>
              )}

              {/* Subtitle info (size or folder indicator) */}
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {item.isFolder ? 'Folder' : formatBytes(item.size)}
              </span>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
