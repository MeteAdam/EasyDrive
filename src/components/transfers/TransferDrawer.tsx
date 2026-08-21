import React, { useState } from 'react';
import { 
  X, 
  ArrowDownUp, 
  Trash2, 
  CheckCheck, 
  Layers, 
  Upload, 
  Download 
} from 'lucide-react';
import { TransferItem } from './TransferItem';
import { useTransferStore } from '../../stores/useTransferStore';

export const TransferDrawer: React.FC = () => {
  const {
    transfers,
    isDrawerOpen,
    setDrawerOpen,
    clearFinished,
    totalSpeed,
    activeCount,
  } = useTransferStore();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  if (!isDrawerOpen) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const filteredTransfers = transfers.filter((t) => {
    if (activeTab === 'active') return t.status === 'running' || t.status === 'queued' || t.status === 'paused';
    if (activeTab === 'completed') return t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled';
    return true;
  });

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-750 shadow-2xl z-50 flex flex-col animate-slide-in-right select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-750 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
            <ArrowDownUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Transfers & Resumable Backups</h3>
            <p className="text-[11px] text-zinc-400">
              {activeCount > 0
                ? `${activeCount} in progress • ${formatBytes(totalSpeed)}/s`
                : 'All transfers finished'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDrawerOpen(false)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs & Clear Actions */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'all' ? 'bg-zinc-800 text-blue-400 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'active' ? 'bg-zinc-800 text-blue-400 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'completed' ? 'bg-zinc-800 text-blue-400 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Done ({transfers.filter((t) => t.status === 'completed').length})
          </button>
        </div>

        <button
          onClick={() => clearFinished()}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 px-2 py-1 rounded-md transition-colors"
          title="Clear Finished Transfers"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Transfer Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 scrollbar-thin">
        {filteredTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
            <Layers className="w-8 h-8 opacity-40" />
            <p className="text-xs">No transfers in this view</p>
          </div>
        ) : (
          filteredTransfers.map((item) => (
            <TransferItem key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
};
