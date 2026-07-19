# Cloud Stream Transfer

Move files between cloud storage providers without ever downloading them to your device. Connect Google Drive, pick a destination — Dropbox, OneDrive, or S3 — and the file streams directly from one cloud to the other.

## Features

- **Google Drive OAuth2 login** — securely list and select your Drive files
- **Direct streaming transfer** — files move server-to-server, no local disk buffering
- **Multi-destination support** — Dropbox, OneDrive, and Amazon S3
- **Provider-agnostic upload layer** — new destinations can be added without touching core logic

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Frontend | HTML, CSS, JavaScript (no framework, no build step) |
| Auth | OAuth2 (Google, Microsoft) |
| APIs | Google Drive API, Microsoft Graph API, Dropbox API, AWS S3 |

## How it works

```
Google Drive  →  Backend (Express)  →  Dropbox / OneDrive / S3
                  streams file, no
                  local disk write
```

1. User connects their Google Drive account (OAuth2)
2. Backend lists their Drive files
3. User picks a file and a destination
4. Backend streams the file directly from Drive into the destination's upload API

## Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- A code editor (e.g. [VS Code](https://code.visualstudio.com/)) with the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for the frontend

### Installation

```bash
git clone https://github.com/Prashantrwt007/cloud-stream-transfer.git
cd cloud-stream-transfer/backend
npm install
cp .env.example .env
```

> **Windows PowerShell:** if `npm install` errors with "running scripts is disabled," run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` first. Use `copy` instead of `cp`.

### Configuration

Fill in `.env` with credentials for whichever providers you want to use:

| Provider | Get credentials from |
|---|---|
| Google Drive | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials |
| OneDrive | [Azure Portal](https://portal.azure.com/) → App registrations |
| Dropbox | [Dropbox App Console](https://www.dropbox.com/developers/apps) |
| AWS S3 | [AWS IAM Console](https://console.aws.amazon.com/iam/) |

Set the OAuth redirect URIs in the Google/Microsoft consoles to:
- `http://localhost:4000/api/google/callback`
- `http://localhost:4000/api/onedrive/callback`

### Run it

```bash
# Terminal 1 — backend
cd backend
npm start
```

Open `frontend/index.html` with Live Server (or any static server). Then open the app in your browser, connect Google Drive, and transfer a file.

## Project Structure

```
frontend/            Static HTML/CSS/JS frontend
backend/
  server.js          Express app — OAuth routes, Drive listing, transfer endpoint
  drive.js            Streams a file from Google Drive
  cloudManager.js      Routes uploads to the correct provider
  clouds/
    s3.js
    onedrive.js
    dropbox.js
```

## Limitations

- Single-user token storage (not session-based) — not built for multiple concurrent users
- No authentication on the API itself
- Google Docs/Sheets/Slides files must be exported before transfer (not yet supported — only binary files like PDFs and images transfer currently)

## License

MIT
