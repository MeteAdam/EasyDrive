import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';

export const NewFolderModal: React.FC = () => {
  const { isNewFolderOpen, setNewFolderOpen, createFolder } = useExplorerStore();
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewFolderOpen) {
      setFolderName('New Folder');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isNewFolderOpen]);

  if (!isNewFolderOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    await createFolder(folderName.trim());
    setNewFolderOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={() => setNewFolderOpen(false)}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-slide-up flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Create New Folder</h3>
          </div>
          <button
            onClick={() => setNewFolderOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Folder Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all select-text"
              placeholder="e.g. Project Assets"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewFolderOpen(false)}
              className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shadow-md shadow-blue-600/20"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
