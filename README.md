# Cloud File Transfer

A full-stack tool that connects to Google Drive via OAuth2 and transfers files
directly to Dropbox, OneDrive, or Amazon S3 — without ever downloading the
file to the user's device. Files are streamed from Google Drive straight into
the destination provider's upload API.

## Why this project

Most portfolio CRUD apps talk to one API. This one demonstrates:

- OAuth2 authorization code flow (Google + Microsoft), including token
  refresh handling
- Streaming file transfer between two third-party services (no local disk
  buffering for S3/OneDrive)
- A small provider-agnostic upload layer (`cloudManager.js`) that makes it
  easy to add a new destination without touching the rest of the app
- A REST API (Express) consumed by a plain JS frontend

## Architecture

```
frontend/            Static HTML/CSS/JS — no build step required
backend/
  server.js          Express app: OAuth routes, Drive listing, transfer endpoint
  drive.js           Wraps the Google Drive API to return a file as a stream
  cloudManager.js     Routes an upload request to the correct provider module
  clouds/
    s3.js            AWS S3 upload
    onedrive.js      Microsoft Graph upload
    dropbox.js       Dropbox upload
  tokens/            Saved OAuth tokens (gitignored, created at runtime)
```

**Flow:** user clicks "Connect Google Drive" → OAuth redirect → backend
stores the token → frontend lists Drive files → user picks a destination and
clicks "Transfer" → backend streams the file from Drive into the chosen
provider's upload API.

## Running it locally in VS Code

### 1. Prerequisites
- [Node.js 18+](https://nodejs.org)
- The [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension (for the frontend)

### 2. Get API credentials
You only need credentials for the providers you want to demo. To get the
whole thing working end-to-end you'll need:

| Provider | Where to register | Scopes needed |
|---|---|---|
| Google | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth Client ID (Web application) | `drive.readonly` |
| Microsoft (OneDrive) | [Azure Portal](https://portal.azure.com/) → App registrations | `Files.ReadWrite`, `offline_access`, `User.Read` |
| Dropbox | [Dropbox App Console](https://www.dropbox.com/developers/apps) | Generate an access token from the app's settings page |
| AWS S3 | [IAM Console](https://console.aws.amazon.com/iam/) → create a user with `s3:PutObject` on your bucket | — |

For Google and Microsoft, set the redirect URI in their respective consoles
to match what's in your `.env` (e.g. `http://localhost:4000/api/google/callback`).

### 3. Install and configure
```bash
cd backend
npm install
cp .env.example .env
# fill in .env with your credentials
```

### 4. Run the backend
```bash
npm run dev      # auto-restarts on changes (nodemon)
# or
npm start
```
The API runs on `http://localhost:4000`.

### 5. Run the frontend
Open `frontend/index.html` in VS Code, right-click → **Open with Live
Server**. It defaults to `http://localhost:5500`.

### 6. Try it
Click **Connect Google Drive**, authorize, pick a destination from the
dropdown, and hit **Transfer** next to any file.

## Deploying it (recommended before putting this on your resume)

A live demo link matters far more to reviewers than a repo they'd have to
run locally. Suggested free-tier setup:

- **Backend** → [Render](https://render.com) or [Railway](https://railway.app): deploy `backend/` as a Node web service, add your env vars in their dashboard.
- **Frontend** → [Vercel](https://vercel.com) or [Netlify](https://netlify.com): deploy `frontend/` as a static site.
- Update `FRONTEND_URL` in the backend env vars and `API_BASE` in `frontend/app.js` to point at your deployed URLs.
- Update the OAuth redirect URIs in the Google/Microsoft consoles to your deployed backend URL.

## Known limitations / next steps

Being upfront about these is good interview material — it shows you
understand the gaps, not just that you shipped something that works:

- **Single-user token storage.** Tokens are saved to local JSON files rather
  than tied to a logged-in session, so this isn't safe for multiple
  concurrent users yet. A natural next step is adding a database
  (Postgres/SQLite) with per-user sessions.
- **No auth on the API itself.** Anyone who can reach the backend can list
  files or trigger transfers once a token exists. Adding session-based auth
  in front of these routes would be a good v2 feature.
- **AWS SDK v2** is used for simplicity; migrating to AWS SDK v3 (modular,
  smaller bundle) would be a reasonable improvement to mention.
- **No automated tests yet.** Adding unit tests around `cloudManager.js` and
  an integration test for `/api/transfer` would round this out.

## Resume bullet ideas

- Built a full-stack file-transfer tool integrating OAuth2 with Google Drive
  and Microsoft Graph, streaming files directly into Dropbox, OneDrive, and
  S3 without local disk buffering.
- Designed a provider-agnostic upload layer supporting three cloud storage
  APIs behind a single interface, making it straightforward to add new
  destinations.
- Deployed a Node/Express backend and static frontend with environment-based
  configuration for local and production use.
