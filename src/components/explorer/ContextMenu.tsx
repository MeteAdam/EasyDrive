import React from 'react';
import { 
  FolderPlus, 
  FilePlus,
  Upload, 
  RotateCw, 
  FolderOpen, 
  Download, 
  Edit3, 
  FolderInput, 
  Star, 
  Trash2, 
  Copy, 
  Info, 
  ExternalLink,
  Undo2,
  FileCheck
} from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useTransferStore } from '../../stores/useTransferStore';
import type { DriveItem } from '../../types/drive';

interface ContextMenuProps {
  x: number;
  y: number;
  targetItem: DriveItem | null;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, targetItem, onClose }) => {
  const {
    currentView,
    selectedIds,
    items,
    navigateToFolder,
    setNewFolderOpen,
    setNewFileOpen,
    setMoveOpen,
    setInlineRenameId,
    setPropertiesItem,
    deleteSelected,
    restoreSelected,
    duplicateSelected,
    toggleStarSelected,
    refresh,
  } = useExplorerStore();

  const { uploadFiles, downloadItem } = useTransferStore();

  const isTrashed = currentView === 'trash' || targetItem?.trashed;
  const isMultiple = selectedIds.length > 1;
  const isFolder = targetItem?.isFolder;

  const handleOpen = () => {
    onClose();
    if (targetItem?.isFolder) {
      navigateToFolder(targetItem.id, targetItem.name);
    } else if (targetItem) {
      setPropertiesItem(targetItem);
    }
  };

  const handleDownload = async () => {
    onClose();
    if (targetItem) {
      await downloadItem(targetItem.id);
    }
  };

  const handleRename = () => {
    onClose();
    if (targetItem) {
      setInlineRenameId(targetItem.id);
    }
  };

  const handleMove = () => {
    onClose();
    setMoveOpen(true);
  };

  const handleToggleStar = async () => {
    onClose();
    await toggleStarSelected();
  };

  const handleDelete = async (permanent = false) => {
    onClose();
    await deleteSelected(permanent);
  };

  const handleRestore = async () => {
    onClose();
    await restoreSelected();
  };

  const handleDuplicate = async () => {
    onClose();
    await duplicateSelected();
  };

  const handleCopyLink = async () => {
    onClose();
    if (targetItem && window.electronAPI) {
      const link = targetItem.webViewLink || `https://drive.google.com/open?id=${targetItem.id}`;
      await window.electronAPI.system.clipboardWriteText(link);
    }
  };

  const handleProperties = () => {
    onClose();
    if (targetItem) {
      setPropertiesItem(targetItem);
    }
  };

  const handleUploadFiles = async () => {
    onClose();
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.system.selectFiles();
    if (paths && paths.length > 0) {
      await uploadFiles(paths);
    }
  };

  const handleUploadFolder = async () => {
    onClose();
    if (!window.electronAPI) return;
    const dirPath = await window.electronAPI.system.selectDirectory();
    if (dirPath) {
      await uploadFiles([dirPath]);
    }
  };

  // 1. Context Menu for Trashed Items
  if (isTrashed) {
    return (
      <div
        className="fixed bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in w-56 flex flex-col gap-0.5 text-xs select-none backdrop-blur-md"
        style={{ left: `${x}px`, top: `${y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleRestore}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors font-medium text-left"
        >
          <Undo2 className="w-4 h-4" />
          <span>Restore from Trash</span>
        </button>
        <button
          onClick={() => handleDelete(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors font-medium text-left"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Permanently</span>
        </button>
      </div>
    );
  }

  // 2. Context Menu for Selected Item(s)
  if (targetItem || isMultiple) {
    return (
      <div
        className="fixed bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in w-60 flex flex-col gap-0.5 text-xs select-none backdrop-blur-md"
        style={{ left: `${x}px`, top: `${y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isMultiple && (
          <button
            onClick={handleOpen}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left font-medium"
          >
            {isFolder ? <FolderOpen className="w-4 h-4 text-amber-400" /> : <Info className="w-4 h-4 text-blue-400" />}
            <span>{isFolder ? 'Open Folder' : 'Open / Preview'}</span>
          </button>
        )}

        <button
          onClick={handleDownload}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download</span>
        </button>

        {!isMultiple && (
          <button
            onClick={handleRename}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
          >
            <Edit3 className="w-4 h-4 text-cyan-400" />
            <span>Rename (F2)</span>
          </button>
        )}

        {!isFolder && !isMultiple && (
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
          >
            <Copy className="w-4 h-4 text-purple-400" />
            <span>Make a Copy</span>
          </button>
        )}

        <button
          onClick={handleMove}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
        >
          <FolderInput className="w-4 h-4 text-indigo-400" />
          <span>Move To...</span>
        </button>

        <button
          onClick={handleToggleStar}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
        >
          <Star className="w-4 h-4 text-amber-400" />
          <span>{targetItem?.starred ? 'Remove from Starred' : 'Add to Starred'}</span>
        </button>

        <div className="h-[1px] bg-zinc-800 my-1" />

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
        >
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span>Copy Shareable Link</span>
        </button>

        <button
          onClick={handleProperties}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
        >
          <Info className="w-4 h-4 text-zinc-400" />
          <span>Properties</span>
        </button>

        <div className="h-[1px] bg-zinc-800 my-1" />

        <button
          onClick={() => handleDelete(false)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors text-left font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span>Move to Trash (Del)</span>
        </button>
      </div>
    );
  }

  // 3. Context Menu for Empty Canvas Area
  return (
    <div
      className="fixed bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in w-56 flex flex-col gap-0.5 text-xs select-none backdrop-blur-md"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          setNewFolderOpen(true);
        }}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left font-medium"
      >
        <FolderPlus className="w-4 h-4 text-amber-400" />
        <span>New Folder</span>
      </button>

      <button
        onClick={() => {
          onClose();
          setNewFileOpen(true);
        }}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left font-medium"
      >
        <FilePlus className="w-4 h-4 text-cyan-400" />
        <span>New File...</span>
      </button>

      <div className="h-[1px] bg-zinc-800 my-1" />

      <button
        onClick={handleUploadFiles}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
      >
        <Upload className="w-4 h-4 text-blue-400" />
        <span>Upload Files...</span>
      </button>

      <button
        onClick={handleUploadFolder}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
      >
        <FolderPlus className="w-4 h-4 text-indigo-400" />
        <span>Upload Folder...</span>
      </button>

      <div className="h-[1px] bg-zinc-800 my-1" />

      <button
        onClick={() => {
          onClose();
          refresh();
        }}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
      >
        <RotateCw className="w-4 h-4 text-cyan-400" />
        <span>Sync / Refresh</span>
      </button>
    </div>
  );
};
