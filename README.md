# EasyDrive

<div align="center">

![EasyDrive Banner](https://img.shields.io/badge/EasyDrive-Cloud%20File%20Manager-blue?style=for-the-badge&logo=google-drive)
![Electron](https://img.shields.io/badge/Electron-30.0-47848F?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<p align="center">
  <b>A high-performance, Windows Explorer-style desktop client for Google Drive.</b><br/>
  Features sub-millisecond local SQLite caching, 32MB chunked resumable transfers, native drag-and-drop, full trash lifecycle management, and a sleek Dark Zinc UI.
</p>

</div>

---

## Features

- **Sub-Millisecond Search & Indexing**: Built-in SQLite database in the Electron main process caches file hierarchies, MIME types, sizes, and metadata for instantaneous zero-latency browsing and filtering.
- **32MB Chunked Resumable Transfers**:
  - **Multi-GB Resilient Uploads**: Large files (1GB – 50GB+) are automatically divided into optimal 32MB chunks (`Content-Range: bytes START-END/TOTAL`) with exponential backoff auto-retry.
  - **Multipart Acceleration**: Small files (≤ 5MB) upload in a single sub-second HTTP POST request.
  - **HTTPS Keep-Alive Connection Pool**: Persistent TLS connection reuse eliminates handshake lag across batches.
  - **Real-Time Telemetry**: Live progress bar, `MB/s` speed meter, ETA timer, and pause/resume/cancel controls.
- **Native Windows Drag-and-Drop**:
  - Drag files or entire folder trees directly from Windows Explorer into EasyDrive to trigger background queue uploads.
  - Drag and drop items internally between the file viewport and sidebar folders for atomic Google Drive move operations.
- **Explorer Layout & Navigation**:
  - Switchable **Grid View** (with thumbnail previews) and **Table View** (with sortable columns: Name, Date Modified, Size, Kind).
  - Collapsible sidebar folder tree, breadcrumb navigation with history (Back / Forward / Up), and instant category filters (Documents, Media, Code, Archives, Starred).
- **Trash Lifecycle & Permanent Deletion**:
  - Dedicated Trash view with one-click **"Empty Trash"** batch deletion.
  - Support for restoring files and permanent deletion via `Shift + Delete` or context menu.
- **In-Place File & Folder Management**:
  - Create new folders (`New Folder`) or new text/document files (`New File...`) with instant naming.
  - In-place renaming (`F2`), star toggling, file property inspection, and duplicate file creation.
- **Secure Local Authentication (BYOC)**:
  - **Bring Your Own Credentials**: Connect your own Google account securely via Google Cloud OAuth 2.0 loopback server (`http://127.0.0.1:8585`).
  - Tokens are encrypted at rest using Electron's native OS Keychain (`safeStorage` API).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Desktop Shell** | [Electron 30](https://www.electronjs.org/) (Multi-process architecture with secure IPC) |
| **Frontend UI** | [React 18](https://react.dev/), [Vite 5](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (Custom Dark Zinc palette) & [Lucide Icons](https://lucide.dev/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Local Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (SQLite in Node.js main thread) |
| **Cloud Engine** | [Google Drive API v3](https://developers.google.com/drive/api/v3/reference) via `googleapis` & `axios` |

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- A **Google Account** (free 15GB or Google Workspace)

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/your-username/easydrive.git

# Enter the directory
cd easydrive

# Install all dependencies
npm install
```

---

## Google Cloud OAuth 2.0 Setup (5-Minute Guide)

EasyDrive connects directly to your own Google Drive using your personal Google Cloud OAuth credentials. Follow these steps to obtain your free Client ID and Client Secret:

1. **Create a Project in Google Cloud Console**:
   - Open [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown at the top left and select **New Project** (name it `EasyDrive`).

2. **Enable Google Drive API**:
   - In the left sidebar, navigate to **APIs & Services > Library**.
   - Search for **Google Drive API**, click on it, and click **Enable**.

3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Choose **External** and click **Create**.
   - Fill in:
     - **App name**: `EasyDrive`
     - **User support email**: (your email)
     - **Developer contact information**: (your email)
   - Click **Save and Continue**.
   - On the **Scopes** page, click **Add or Remove Scopes** and check:
     - `.../auth/drive`
     - `.../auth/drive.metadata.readonly`
     - `.../auth/userinfo.profile`
     - `.../auth/userinfo.email`
   - On the **Test users** page, click **Add Users** and add your Google account email address. Click **Save and Continue**.

4. **Create Desktop OAuth Credentials**:
   - Go to **APIs & Services > Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - **Application type**: Select **Desktop app**.
   - **Name**: `EasyDrive Desktop Client`.
   - Click **Create**.
   - Copy your **Client ID** (e.g., `xxxx.apps.googleusercontent.com`) and **Client Secret** (e.g., `GOCSPX-xxxx`).

---

## Connecting Your Account

You can connect your Google account in **two easy ways**:

### Option A: Via the In-App Settings UI (Recommended)
1. Start the application:
   ```bash
   npm run dev
   ```
2. In the top navigation or sidebar, click **Connect Account** or **Settings (⚙️)**.
3. Paste your **Client ID** and **Client Secret**.
4. Click **Connect Google Account**.
5. Your default web browser will open. Select your Google account, click **Continue / Allow**, and EasyDrive will instantly log in and synchronize your files!

### Option B: Via `.env` File (For Developers)
Copy `.env.example` to `.env` in the project root:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_OAUTH_PORT=8585
```
Then start the app: `npm run dev`.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + A` | Select all files and folders in view |
| `Delete` | Move selected item(s) to Trash (or permanently delete if in Trash view) |
| `Shift + Delete` | Permanently delete selected item(s) immediately |
| `F2` | Inline rename selected item |
| `F5` | Synchronize and refresh directory with Google Drive |
| `Alt + Left` | History: Navigate back |
| `Alt + Right` | History: Navigate forward |
| `Alt + Up` | Navigate up one folder level |
| `Escape` | Clear current selection / close active dialogs |

---

## Building for Distribution

To build the optimized production desktop app for Windows:

```bash
# Typecheck and bundle React + Electron code
npm run build
```

---

## Troubleshooting & FAQ

<details>
<summary><b>Q: Google says "Google hasn't verified this app" during login. What should I do?</b></summary>
Since you created your own personal OAuth client ID in Testing mode, Google shows a standard verification notice. Simply click <b>Advanced</b> (Gelişmiş) at the bottom and click <b>Go to EasyDrive (unsafe)</b> to proceed.
</details>

<details>
<summary><b>Q: Why does a transfer fail with "Storage quota exceeded"?</b></summary>
Google Drive provides 15GB of total storage for free accounts (shared with Gmail and Google Photos). If your cloud storage is full, free up space on Google Drive or empty the EasyDrive Trash view.
</details>

<details>
<summary><b>Q: Can multiple users use this repository?</b></summary>
Yes! Each user has their own Google Cloud OAuth credentials and local encrypted storage. No personal tokens or credentials are hardcoded in the codebase.
</details>

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.
