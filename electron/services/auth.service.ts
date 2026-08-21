import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';
import { app, safeStorage, shell } from 'electron';
import { google } from 'googleapis';
import { dbService } from './db.service';
import { driveService } from './drive.service';
import type { AuthStatus, AppSettings } from '../../src/types/drive';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

export class AuthService {
  private configPath: string;
  private tokenPath: string;
  private settings: AppSettings;
  private oauth2Client: any = null;
  private activeOAuthServer: http.Server | null = null;

  constructor() {
    const userData = app ? app.getPath('userData') : process.cwd();
    this.configPath = path.join(userData, 'settings.json');
    this.tokenPath = path.join(userData, 'tokens.enc');
    this.settings = this.loadSettings();
    this.initOAuthClient();
  }

  private loadSettings(): AppSettings {
    const defaultSettings: AppSettings = {
      clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || '',
      syncIntervalMinutes: 5,
      maxConcurrentTransfers: 3,
      defaultDownloadPath: app ? app.getPath('downloads') : '',
      enableLocalCache: true,
      port: 8585,
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        return { ...defaultSettings, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error('[AuthService] Error loading settings:', e);
    }
    return defaultSettings;
  }

  public saveSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2), 'utf8');
      this.initOAuthClient();
      return true;
    } catch (e) {
      console.error('[AuthService] Error saving settings:', e);
      return false;
    }
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  private initOAuthClient() {
    if (this.settings.clientId && this.settings.clientSecret) {
      const redirectUri = `http://127.0.0.1:${this.settings.port}/oauth2callback`;
      this.oauth2Client = new google.auth.OAuth2(
        this.settings.clientId.trim(),
        this.settings.clientSecret.trim(),
        redirectUri
      );

      // Load saved token if present
      const tokens = this.loadTokens();
      if (tokens) {
        this.oauth2Client.setCredentials(tokens);
      }
    } else {
      this.oauth2Client = null;
    }
  }

  private loadTokens(): any {
    try {
      if (!fs.existsSync(this.tokenPath)) return null;
      const buffer = fs.readFileSync(this.tokenPath);
      
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(buffer);
        return JSON.parse(decrypted);
      } else {
        // Fallback Base64 encoding
        const decrypted = Buffer.from(buffer.toString('utf8'), 'base64').toString('utf8');
        return JSON.parse(decrypted);
      }
    } catch (e) {
      console.warn('[AuthService] Could not decrypt tokens:', e);
      return null;
    }
  }

  private saveTokens(tokens: any) {
    try {
      const tokenStr = JSON.stringify(tokens);
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(tokenStr);
        fs.writeFileSync(this.tokenPath, encrypted);
      } else {
        const encrypted = Buffer.from(tokenStr, 'utf8').toString('base64');
        fs.writeFileSync(this.tokenPath, encrypted, 'utf8');
      }
    } catch (e) {
      console.error('[AuthService] Error saving tokens:', e);
    }
  }

  public async getStatus(): Promise<AuthStatus> {
    const hasCredentials = Boolean(this.settings.clientId && this.settings.clientSecret);
    if (!hasCredentials || !this.oauth2Client) {
      return {
        isAuthenticated: false,
        hasCredentials: false,
      };
    }

    const tokens = this.loadTokens();
    if (!tokens) {
      return {
        isAuthenticated: false,
        hasCredentials: true,
      };
    }

    try {
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userinfo = await oauth2.userinfo.get();
      return {
        isAuthenticated: true,
        user: {
          displayName: userinfo.data.name || 'Google User',
          email: userinfo.data.email || '',
          photoLink: userinfo.data.picture || '',
        },
        hasCredentials: true,
      };
    } catch (e) {
      console.warn('[AuthService] Error verifying auth token:', e);
      return {
        isAuthenticated: false,
        hasCredentials: true,
      };
    }
  }

  public async login(): Promise<{ success: boolean; error?: string }> {
    this.initOAuthClient();

    const cleanClientId = (this.settings.clientId || '').trim();
    const cleanClientSecret = (this.settings.clientSecret || '').trim();

    if (!cleanClientId || !cleanClientSecret) {
      return { 
        success: false, 
        error: 'Client ID and Client Secret are required. Please input your Google Cloud credentials in Settings.' 
      };
    }

    // Close any previous server
    if (this.activeOAuthServer) {
      try {
        this.activeOAuthServer.close();
      } catch (e) {}
      this.activeOAuthServer = null;
    }

    return new Promise((resolve) => {
      let isResolved = false;

      const server = http.createServer(async (req, res) => {
        try {
          if (req.url && (req.url.includes('/oauth2callback') || req.url.startsWith('/?code='))) {
            const parsedUrl = new url.URL(req.url, `http://127.0.0.1:${this.settings.port}`);
            const code = parsedUrl.searchParams.get('code');
            const errorParam = parsedUrl.searchParams.get('error');

            if (errorParam) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Authentication Failed</title>
                  <style>
                    body { background: #09090b; color: #f4f4f5; font-family: Segoe UI, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: #18181b; border: 1px solid #7f1d1d; border-radius: 12px; padding: 32px; text-align: center; max-width: 420px; }
                    h2 { color: #f87171; margin-bottom: 12px; }
                    p { color: #a1a1aa; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h2>Authentication Cancelled or Failed</h2>
                    <p>${errorParam}</p>
                  </div>
                </body>
                </html>
              `);

              try { server.close(); } catch (e) {}
              if (!isResolved) {
                isResolved = true;
                resolve({ success: false, error: `Google OAuth Error: ${errorParam}` });
              }
              return;
            }

            if (code) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Authentication Successful - EasyDrive</title>
                  <style>
                    body { background: #09090b; color: #f4f4f5; font-family: Segoe UI, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 32px; text-align: center; max-width: 440px; }
                    h2 { color: #3b82f6; margin-bottom: 12px; }
                    p { color: #a1a1aa; font-size: 14px; line-height: 1.5; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h2>Authentication Successful</h2>
                    <p>EasyDrive is now connected to your Google Drive account. You can close this tab and return to the application.</p>
                  </div>
                </body>
                </html>
              `);

              try { server.close(); } catch (e) {}

              try {
                const { tokens } = await this.oauth2Client.getToken(code);
                this.oauth2Client.setCredentials(tokens);
                this.saveTokens(tokens);

                // Sync initial Drive contents
                await driveService.fetchItems('root', true);
                await driveService.getQuota();

                if (!isResolved) {
                  isResolved = true;
                  resolve({ success: true });
                }
              } catch (tokenErr: any) {
                console.error('[AuthService] Token exchange error:', tokenErr);
                if (!isResolved) {
                  isResolved = true;
                  resolve({ success: false, error: `Token exchange error: ${tokenErr.message}` });
                }
              }
            } else {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('Authorization code missing.');
              try { server.close(); } catch (e) {}
              if (!isResolved) {
                isResolved = true;
                resolve({ success: false, error: 'Authorization code missing from callback' });
              }
            }
          }
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('Internal server error during authentication.');
          try { server.close(); } catch (e) {}
          if (!isResolved) {
            isResolved = true;
            resolve({ success: false, error: err.message || 'OAuth loopback server failure' });
          }
        }
      });

      this.activeOAuthServer = server;

      server.listen(this.settings.port, '0.0.0.0', () => {
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          prompt: 'consent',
        });
        shell.openExternal(authUrl);
      });

      server.on('error', (err: any) => {
        console.error('[AuthService] Server listen error:', err);
        if (!isResolved) {
          isResolved = true;
          resolve({ 
            success: false, 
            error: `Local OAuth listener could not start on port ${this.settings.port} (${err.code || err.message}). Please ensure the port is free.` 
          });
        }
      });

      // 3 minutes timeout
      setTimeout(() => {
        try { server.close(); } catch (e) {}
        if (!isResolved) {
          isResolved = true;
          resolve({ success: false, error: 'Authentication timed out (3 minutes). Please try again.' });
        }
      }, 180000);
    });
  }

  public async logout(): Promise<{ success: boolean }> {
    try {
      if (fs.existsSync(this.tokenPath)) {
        fs.unlinkSync(this.tokenPath);
      }
      if (this.oauth2Client) {
        this.oauth2Client.setCredentials({});
      }
      dbService.clearCache();
      return { success: true };
    } catch (e) {
      console.error('[AuthService] Error during logout:', e);
      return { success: false };
    }
  }

  public getAuthenticatedClient(): any {
    return this.oauth2Client;
  }
}

export const authService = new AuthService();
