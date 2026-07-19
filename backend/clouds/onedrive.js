import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, "..", "tokens", "onedrive_tokens.json");

/**
 * Streams a file to the signed-in user's OneDrive root.
 * @param {NodeJS.ReadableStream} stream
 * @param {string} filename
 */
export async function uploadToOneDrive(stream, filename) {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("Not connected to OneDrive yet. Visit /api/onedrive/url to authenticate.");
  }

  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  const accessToken = tokenData.access_token;

  const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(filename)}:/content`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: stream,
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[OneDrive] Upload error:", result);
    throw new Error(result.error?.message || "OneDrive upload failed");
  }

  console.log(`[OneDrive] Uploaded "${filename}"`);
  return { provider: "onedrive", location: result.webUrl, name: result.name };
}
