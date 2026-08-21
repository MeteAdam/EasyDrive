import React, { useState, useEffect, useRef } from 'react';
import { FilePlus, X } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';

export const NewFileModal: React.FC = () => {
  const { isNewFileOpen, setNewFileOpen, createFile } = useExplorerStore();
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewFileOpen) {
      setFileName('New Document.txt');
      setFileContent('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIdx = 'New Document.txt'.lastIndexOf('.');
          if (dotIdx > 0) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isNewFileOpen]);

  if (!isNewFileOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    await createFile(fileName.trim(), fileContent);
    setNewFileOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={() => setNewFileOpen(false)}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-slide-up flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Create New File</h3>
          </div>
          <button
            onClick={() => setNewFileOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              File Name (e.g. notes.txt, document.md)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all select-text"
              placeholder="e.g. notes.txt"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Initial Content (Optional)
            </label>
            <textarea
              rows={3}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none select-text"
              placeholder="Type initial text here..."
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewFileOpen(false)}
              className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shadow-md shadow-blue-600/20"
            >
              Create File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
