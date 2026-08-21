import React from 'react';
import { 
  Upload, 
  Download, 
  Pause, 
  Play, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { useTransferStore } from '../../stores/useTransferStore';
import type { TransferItem as TransferItemType } from '../../types/drive';

interface TransferItemProps {
  item: TransferItemType;
}

export const TransferItem: React.FC<TransferItemProps> = ({ item }) => {
  const { pauseTransfer, resumeTransfer, cancelTransfer } = useTransferStore();

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (speed?: number) => {
    if (!speed || speed === 0) return '0 KB/s';
    return `${formatBytes(speed)}/s`;
  };

  const formatEta = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '';
    if (seconds < 60) return `${seconds}s left`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s left`;
  };

  return (
    <div className="p-3 bg-zinc-900 border border-zinc-750/80 rounded-xl flex flex-col gap-2 transition-all hover:border-zinc-600">
      {/* Header with Title & Action Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              item.type === 'upload'
                ? 'bg-blue-600/20 text-blue-400'
                : 'bg-emerald-600/20 text-emerald-400'
            }`}
          >
            {item.type === 'upload' ? <Upload className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-zinc-200 truncate" title={item.name}>
              {item.name}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
              <span>{formatBytes(item.transferredBytes)} of {formatBytes(item.totalBytes)}</span>
              {item.status === 'running' && (
                <>
                  <span>•</span>
                  <span className="text-blue-400 font-medium">{formatSpeed(item.speed)}</span>
                  {item.eta > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-500">{formatEta(item.eta)}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* State Badge & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.status === 'running' && (
            <button
              onClick={() => pauseTransfer(item.id)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Pause Transfer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {item.status === 'paused' && (
            <button
              onClick={() => resumeTransfer(item.id)}
              className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-zinc-800 transition-colors"
              title="Resume Transfer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {(item.status === 'running' || item.status === 'queued' || item.status === 'paused') && (
            <button
              onClick={() => cancelTransfer(item.id)}
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              title="Cancel Transfer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {item.status === 'completed' && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Done</span>
            </div>
          )}

          {item.status === 'failed' && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md" title={item.error}>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </div>
          )}

          {item.status === 'queued' && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              <span>Queued</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
        <div
          className={`h-full transition-all duration-200 rounded-full ${
            item.status === 'completed'
              ? 'bg-emerald-500'
              : item.status === 'failed'
              ? 'bg-rose-500'
              : item.status === 'paused'
              ? 'bg-amber-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}
          style={{ width: `${Math.max(item.status === 'completed' ? 100 : 0, item.progress)}%` }}
        />
      </div>

      {/* Error Message if Failed */}
      {item.status === 'failed' && item.error && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2 py-1 rounded-md mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
          <span className="truncate" title={item.error}>{item.error}</span>
        </div>
      )}
    </div>
  );
};
