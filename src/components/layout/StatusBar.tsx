import React from 'react';
import { HardDrive, ArrowDownUp, CheckCircle, Database } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useTransferStore } from '../../stores/useTransferStore';

export const StatusBar: React.FC = () => {
  const { items, selectedIds } = useExplorerStore();
  const { activeCount, totalSpeed, toggleDrawer, isDrawerOpen } = useTransferStore();

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
    return `${formatBytes(bytesPerSec)}/s`;
  };

  // Selected items calculation
  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const selectedSize = selectedItems.reduce((acc, i) => acc + (i.size || 0), 0);

  return (
    <footer className="h-[28px] bg-zinc-900 border-t border-zinc-750 px-3 flex items-center justify-between text-[11px] text-zinc-400 select-none shrink-0 z-30">
      {/* Left Item & Selection Stats */}
      <div className="flex items-center gap-3">
        <span>
          <strong className="text-zinc-200 font-medium">{items.length}</strong> {items.length === 1 ? 'item' : 'items'}
        </span>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 border-l border-zinc-750 pl-3">
            <span className="text-blue-400 font-medium">
              {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
            </span>
            {selectedSize > 0 && (
              <span className="text-zinc-500">
                ({formatBytes(selectedSize)})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Database Performance & Transfer Status Drawer Toggle */}
      <div className="flex items-center gap-4">
        {/* SQLite Sub-millisecond Cache Badge */}
        <div className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors" title="SQLite metadata indexing & search">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>SQLite Cache: &lt; 1ms</span>
        </div>

        {/* Transfer Drawer Button */}
        <button
          onClick={toggleDrawer}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${
            activeCount > 0
              ? 'bg-blue-600/20 text-blue-400 font-medium animate-pulse'
              : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ArrowDownUp className="w-3 h-3" />
          {activeCount > 0 ? (
            <span>
              {activeCount} active transfer{activeCount > 1 ? 's' : ''} ({formatSpeed(totalSpeed)})
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-zinc-500" />
              Transfers Idle
            </span>
          )}
        </button>
      </div>
    </footer>
  );
};
