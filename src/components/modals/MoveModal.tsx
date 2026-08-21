import React, { useState } from 'react';
import { FolderInput, X, HardDrive, Folder, Check } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import type { DriveFolder } from '../../types/drive';

export const MoveModal: React.FC = () => {
  const { isMoveOpen, setMoveOpen, folderTree, moveSelected, selectedIds, items } = useExplorerStore();
  const [targetFolderId, setTargetFolderId] = useState<string>('root');

  if (!isMoveOpen) return null;

  const handleMove = async () => {
    await moveSelected(targetFolderId);
  };

  const renderFolderOptions = (folders: DriveFolder[], depth = 0) => {
    return folders.map((folder) => {
      // Don't allow moving into one of the selected folders
      if (selectedIds.includes(folder.id)) return null;

      const isSelected = targetFolderId === folder.id;

      return (
        <React.Fragment key={folder.id}>
          <div
            onClick={() => setTargetFolderId(folder.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
              isSelected
                ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/50'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
          </div>

          {folder.children && folder.children.length > 0 && renderFolderOptions(folder.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-slide-up flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Move Items</h3>
              <p className="text-[11px] text-zinc-400">
                Moving {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMoveOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Folder Selector */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 max-h-60 overflow-y-auto flex flex-col gap-1 scrollbar-thin">
          {/* Root Destination */}
          <div
            onClick={() => setTargetFolderId('root')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
              targetFolderId === 'root'
                ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/50'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>My Drive (Root)</span>
            </div>
            {targetFolderId === 'root' && <Check className="w-3.5 h-3.5 text-blue-400" />}
          </div>

          {/* Subfolders */}
          {renderFolderOptions(folderTree)}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setMoveOpen(false)}
            className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md shadow-blue-600/20"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};
