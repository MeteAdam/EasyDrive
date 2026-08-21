import React from 'react';
import { Info, X, ExternalLink, Copy, HardDrive, FileText, Calendar, Hash, Tag } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';

export const PropertiesModal: React.FC = () => {
  const { propertiesItem, setPropertiesItem } = useExplorerStore();

  if (!propertiesItem) return null;

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]} (${bytes.toLocaleString()} bytes)`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCopyLink = async () => {
    if (!window.electronAPI) return;
    const link = propertiesItem.webViewLink || `https://drive.google.com/open?id=${propertiesItem.id}`;
    await window.electronAPI.system.clipboardWriteText(link);
  };

  const handleOpenExternal = async () => {
    if (!window.electronAPI) return;
    const link = propertiesItem.webViewLink || `https://drive.google.com/open?id=${propertiesItem.id}`;
    await window.electronAPI.system.openExternal(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-slide-up flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 truncate max-w-[280px]">
              {propertiesItem.name}
            </h3>
          </div>
          <button
            onClick={() => setPropertiesItem(null)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Preview if present */}
        {propertiesItem.thumbnailLink && (
          <div className="w-full h-36 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
            <img
              src={propertiesItem.thumbnailLink}
              alt={propertiesItem.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Properties Details Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-500" /> File Type
            </span>
            <span className="text-zinc-200 font-medium truncate max-w-[220px]">
              {propertiesItem.isFolder ? 'Folder' : propertiesItem.mimeType}
            </span>
          </div>

          {!propertiesItem.isFolder && (
            <div className="flex items-center justify-between py-1 border-b border-zinc-850">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" /> Size
              </span>
              <span className="text-zinc-200 font-medium">
                {formatBytes(propertiesItem.size)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Date Modified
            </span>
            <span className="text-zinc-200 font-medium text-[11px]">
              {formatDate(propertiesItem.modifiedTime)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-850">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-zinc-500" /> Drive File ID
            </span>
            <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[200px]" title={propertiesItem.id}>
              {propertiesItem.id}
            </span>
          </div>

          {propertiesItem.md5Checksum && (
            <div className="flex items-center justify-between py-1 border-b border-zinc-850">
              <span className="text-zinc-400">MD5 Hash</span>
              <span className="text-zinc-400 font-mono text-[10px]">
                {propertiesItem.md5Checksum}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-600/15 hover:bg-blue-600/25 rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Drive</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPropertiesItem(null)}
            className="px-4 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
