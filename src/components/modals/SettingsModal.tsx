import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Key, 
  Database, 
  RotateCw, 
  Trash2, 
  Check, 
  ShieldCheck, 
  LogIn, 
  LogOut,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useExplorerStore } from '../../stores/useExplorerStore';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    settings, 
    updateSettings, 
    status, 
    login, 
    logout 
  } = useAuthStore();

  const { refresh } = useExplorerStore();

  const [clientId, setClientId] = useState(settings.clientId || '');
  const [clientSecret, setClientSecret] = useState(settings.clientSecret || '');
  const [port, setPort] = useState(settings.port || 8585);
  const [maxTransfers, setMaxTransfers] = useState(settings.maxConcurrentTransfers || 3);
  const [dbStats, setDbStats] = useState<{ totalItems: number; totalFolders: number; totalFiles: number; dbSizeBytes: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      setClientId(settings.clientId || '');
      setClientSecret(settings.clientSecret || '');
      setPort(settings.port || 8585);
      setMaxTransfers(settings.maxConcurrentTransfers || 3);
      setErrorMessage(null);
      loadStats();
    }
  }, [isSettingsOpen, settings]);

  const loadStats = async () => {
    if (!window.electronAPI) return;
    const stats = await window.electronAPI.drive.getDatabaseStats();
    setDbStats(stats);
  };

  if (!isSettingsOpen) return null;

  const handleSaveOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    const success = await updateSettings({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      port: Number(port),
      maxConcurrentTransfers: Number(maxTransfers),
    });
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
    return success;
  };

  const handleConnectOAuth = async () => {
    setErrorMessage(null);

    const cleanId = clientId.trim();
    const cleanSec = clientSecret.trim();

    if (!cleanId || !cleanSec) {
      setErrorMessage('Please fill in both Client ID and Client Secret fields.');
      return;
    }

    // Auto-save settings first
    await updateSettings({
      clientId: cleanId,
      clientSecret: cleanSec,
      port: Number(port),
      maxConcurrentTransfers: Number(maxTransfers),
    });

    setIsConnecting(true);

    try {
      const res = await login();
      setIsConnecting(false);

      if (res.success) {
        setSettingsOpen(false);
        await loadStats();
        await refresh();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check your credentials and try again.');
      }
    } catch (err: any) {
      setIsConnecting(false);
      setErrorMessage(err.message || 'Connection error occurred.');
    }
  };

  const handleClearCache = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.drive.clearLocalCache();
    await loadStats();
    await refresh();
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in select-none p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-slide-up flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">EasyDrive Settings</h3>
              <p className="text-[11px] text-zinc-400">Google Cloud Credentials, SQLite Index & Transfers</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-600/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">Connection Error</p>
              <p className="text-[11px] text-rose-200/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Connecting Spinner Notice */}
        {isConnecting && (
          <div className="p-3.5 bg-blue-950/60 border border-blue-500/50 rounded-xl flex items-center gap-3 text-xs text-blue-200 animate-fade-in">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-blue-100">Waiting for Google Authorization in Browser...</p>
              <p className="text-[11px] text-blue-300 mt-0.5">
                Please complete the login and grant permissions in your browser tab.
              </p>
            </div>
          </div>
        )}

        {/* OAuth Authentication Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-semibold text-zinc-200">Google Cloud OAuth 2.0 Credentials</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  status.isAuthenticated ? 'bg-emerald-400' : 'bg-zinc-500'
                }`}
              />
              <span className="text-[11px] text-zinc-400">
                {status.isAuthenticated ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-400">
                  Client ID
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>How to get credentials?</span>
                  {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 637215283202-xxxxx.apps.googleusercontent.com"
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Help Drawer for Google Cloud Console */}
            {showHelp && (
              <div className="bg-zinc-900/90 border border-zinc-750 rounded-lg p-3 text-[11px] text-zinc-300 flex flex-col gap-2">
                <p className="font-semibold text-blue-400">Google Cloud Console Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px]">
                  <li>
                    Create or select a project on{' '}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console <ExternalLink className="w-3 h-3 inline" />
                    </a>.
                  </li>
                  <li>Enable <strong>Google Drive API</strong> under <strong>APIs & Services &gt; Library</strong>.</li>
                  <li>In <strong>OAuth consent screen</strong>, select <strong>External</strong> and add your own email to <strong>Test users</strong>.</li>
                  <li>In <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>, select application type <strong>Desktop app</strong>.</li>
                  <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong>, paste them above, and click <strong>Connect Google Account</strong>!</li>
                </ol>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  OAuth Loopback Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Max Concurrent Transfers
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxTransfers}
                  onChange={(e) => setMaxTransfers(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Tokens encrypted locally via Electron safeStorage
              </span>
              <button
                type="button"
                onClick={() => handleSaveOnly()}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{isSaved ? 'Saved' : 'Save Config'}</span>
              </button>
            </div>
          </div>

          {/* Connect Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-850">
            {status.isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Google Drive</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectOAuth}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-lg shadow-blue-600/20 active:scale-[0.99]"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{isConnecting ? 'Waiting for Login...' : 'Connect Google Account (OAuth 2.0)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* SQLite Database & Cache Diagnostics */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-zinc-200">Local SQLite Index & Cache</h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              Sub-millisecond Search Active
            </span>
          </div>

          {dbStats && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                <span className="text-[10px] text-zinc-500 block">Total Items</span>
                <span className="text-xs font-bold text-zinc-200">{dbStats.totalItems}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                <span className="text-[10px] text-zinc-500 block">Folders</span>
                <span className="text-xs font-bold text-zinc-200">{dbStats.totalFolders}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                <span className="text-[10px] text-zinc-500 block">Files</span>
                <span className="text-xs font-bold text-zinc-200">{dbStats.totalFiles}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                <span className="text-[10px] text-zinc-500 block">DB Size</span>
                <span className="text-xs font-bold text-zinc-200">{formatBytes(dbStats.dbSizeBytes)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/15 rounded-lg border border-rose-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Local Cache</span>
            </button>
            <button
              onClick={async () => {
                await refresh();
                await loadStats();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-200 bg-zinc-800 hover:bg-zinc-750 rounded-lg transition-colors font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Re-index Sync</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
