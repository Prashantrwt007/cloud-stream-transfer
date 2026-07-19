import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { google } from "googleapis";

import { getDriveFileStream } from "./drive.js";
import { uploadToCloud } from "./cloudManager.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = path.join(__dirname, "tokens");
const GOOGLE_TOKEN_PATH = path.join(TOKENS_DIR, "google_tokens.json");
const ONEDRIVE_TOKEN_PATH = path.join(TOKENS_DIR, "onedrive_tokens.json");

if (!fs.existsSync(TOKENS_DIR)) fs.mkdirSync(TOKENS_DIR);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5500/Frontend/index.html";

/* ================= GOOGLE OAUTH ================= */

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Load a saved token on startup, if one exists, so a restart doesn't force re-login.
if (fs.existsSync(GOOGLE_TOKEN_PATH)) {
  try {
    oauth2Client.setCredentials(JSON.parse(fs.readFileSync(GOOGLE_TOKEN_PATH, "utf-8")));
  } catch {
    console.warn("Could not parse saved Google token, ignoring it.");
  }
}

app.get("/api/google/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  res.json({ url });
});

app.get("/api/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing authorization code from Google.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(GOOGLE_TOKEN_PATH, JSON.stringify(tokens, null, 2));
    res.redirect(`${FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).send("Google authentication failed.");
  }
});

/* ================= GOOGLE DRIVE FILE LIST ================= */

app.get("/api/drive/files", async (req, res) => {
  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const result = await drive.files.list({
      pageSize: 50,
      fields: "files(id, name, mimeType)",
    });
    res.json(result.data.files);
  } catch (err) {
    console.error("Drive fetch failed:", err.message);
    res.status(500).json({ error: "Drive fetch failed. Are you logged in with Google?" });
  }
});

/* ================= ONEDRIVE OAUTH ================= */

app.get("/api/onedrive/url", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.ONEDRIVE_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.ONEDRIVE_REDIRECT_URI,
    response_mode: "query",
    scope: "offline_access Files.ReadWrite User.Read",
  });

  const url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + params.toString();
  res.json({ url });
});

app.get("/api/onedrive/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing authorization code from Microsoft.");
  }

  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.ONEDRIVE_CLIENT_ID,
        client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.ONEDRIVE_REDIRECT_URI,
        scope: "offline_access Files.ReadWrite User.Read",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("OneDrive token error:", tokenData);
      return res.status(400).send("OneDrive authentication failed. Check your client secret.");
    }

    fs.writeFileSync(ONEDRIVE_TOKEN_PATH, JSON.stringify(tokenData, null, 2));
    console.log("OneDrive token saved successfully.");
    res.redirect(`${FRONTEND_URL}?onedrive=success`);
  } catch (err) {
    console.error("OneDrive callback error:", err);
    res.status(500).send("OneDrive authentication error.");
  }
});

/* ================= TRANSFER API ================= */

app.post("/api/transfer", async (req, res) => {
  const { fileId, filename, destination } = req.body;

  if (!fileId || !filename || !destination) {
    return res.status(400).json({ success: false, error: "fileId, filename, and destination are required." });
  }

  try {
    const stream = await getDriveFileStream(oauth2Client, fileId);
    const result = await uploadToCloud(destination, stream, filename);
    res.json({ success: true, result });
  } catch (err) {
    console.error("Transfer failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= HEALTH CHECK ================= */

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================= SERVER ================= */

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
