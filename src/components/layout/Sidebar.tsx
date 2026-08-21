import React, { useState } from 'react';
import { 
  HardDrive, 
  Star, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  FolderPlus, 
  FilePlus,
  Upload, 
  Plus, 
  ChevronDown, 
  User, 
  LogOut, 
  LogIn, 
  Cloud,
  FolderTree as FolderTreeIcon
} from 'lucide-react';
import { FolderTree } from '../explorer/FolderTree';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTransferStore } from '../../stores/useTransferStore';
import type { QuickAccessView } from '../../types/drive';

export const Sidebar: React.FC = () => {
  const { currentView, navigateToView, setNewFolderOpen, setNewFileOpen } = useExplorerStore();
  const { status, login, logout, setSettingsOpen } = useAuthStore();
  const { uploadFiles } = useTransferStore();
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  const quickNavItems: { id: QuickAccessView; label: string; icon: any; color: string }[] = [
    { id: 'my-drive', label: 'My Drive', icon: HardDrive, color: 'text-blue-400' },
    { id: 'starred', label: 'Starred', icon: Star, color: 'text-amber-400' },
    { id: 'recent', label: 'Recent Files', icon: Clock, color: 'text-emerald-400' },
    { id: 'trash', label: 'Trash', icon: Trash2, color: 'text-rose-400' },
    { id: 'backups', label: 'Local & Cloud Backups', icon: ShieldCheck, color: 'text-purple-400' },
  ];

  const handleNativeFileUpload = async () => {
    setIsNewMenuOpen(false);
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.system.selectFiles();
    if (paths && paths.length > 0) {
      await uploadFiles(paths);
    }
  };

  const handleNativeFolderUpload = async () => {
    setIsNewMenuOpen(false);
    if (!window.electronAPI) return;
    const dirPath = await window.electronAPI.system.selectDirectory();
    if (dirPath) {
      await uploadFiles([dirPath]);
    }
  };

  return (
    <aside className="w-[260px] bg-zinc-900 border-r border-zinc-750 flex flex-col justify-between select-none shrink-0 h-full">
      {/* Top Header & New Button */}
      <div className="p-3 border-b border-zinc-750/70">
        {/* App Title Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cloud className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight leading-none">EasyDrive</h1>
            <span className="text-[10px] text-zinc-400 font-medium">Cloud File Manager</span>
          </div>
        </div>

        {/* Action + New Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Action</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isNewMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNewMenuOpen(false)} 
              />
              <div className="absolute top-full left-0 mt-1 w-full bg-zinc-850 border border-zinc-700 rounded-lg shadow-2xl p-1.5 z-50 animate-fade-in flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setIsNewMenuOpen(false);
                    setNewFolderOpen(true);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700/80 rounded-md transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => {
                    setIsNewMenuOpen(false);
                    setNewFileOpen(true);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700/80 rounded-md transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New File...</span>
                </button>
                <div className="h-[1px] bg-zinc-750 my-0.5" />
                <button
                  onClick={handleNativeFileUpload}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700/80 rounded-md transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload Files...</span>
                </button>
                <button
                  onClick={handleNativeFolderUpload}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700/80 rounded-md transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload Folder...</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-4 scrollbar-thin">
        {/* Quick Access List */}
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 block mb-1.5">
            Quick Access
          </span>
          <nav className="flex flex-col gap-0.5">
            {quickNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500 shadow-sm'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Hierarchical Folder Directory Tree */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTreeIcon className="w-3 h-3" />
              Folders Hierarchy
            </span>
          </div>
          <div className="bg-zinc-950/50 rounded-lg p-1 border border-zinc-800/60 max-h-[340px] overflow-y-auto">
            <FolderTree />
          </div>
        </div>
      </div>

      {/* Bottom User Profile Pill & OAuth Status */}
      <div className="p-3 border-t border-zinc-750/70 bg-zinc-950/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-750/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {status.user?.photoLink ? (
              <img
                src={status.user.photoLink}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate leading-none mb-1">
                {status.user?.displayName || 'Offline / Guest'}
              </p>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    status.isAuthenticated
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-zinc-500'
                  }`}
                />
                <span className="text-[10px] text-zinc-400 truncate">
                  {status.isAuthenticated ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div>
            {status.isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                title="Connect with Google OAuth"
              >
                <LogIn className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
