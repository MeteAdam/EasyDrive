import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipc/handlers';
import { driveService } from './services/drive.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├── main.js
// │ └── preload.cjs
// ├─┬ dist
// │ └── index.html

process.env.DIST = path.join(__dirname, '../dist');
let win: BrowserWindow | null = null;
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

async function createWindow() {
  const preload = path.join(__dirname, 'preload.cjs');
  console.log('[Main] Starting EasyDrive with preload:', preload, 'exists:', fs.existsSync(preload));

  win = new BrowserWindow({
    title: 'EasyDrive - Cloud File Manager',
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 620,
    backgroundColor: '#09090b',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Register all IPC endpoints
  registerIpcHandlers();

  // Handle external links opening in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (url) {
    win.loadURL(url);
    // win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Periodic background synchronization (every 5 minutes)
  setInterval(() => {
    driveService.syncChanges().catch((err) => {
      console.warn('[Main] Background sync warning:', err);
    });
  }, 5 * 60 * 1000);
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
