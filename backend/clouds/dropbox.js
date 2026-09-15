import { Dropbox } from "dropbox";
import fetch from "node-fetch";

/**
 * Buffers the incoming stream and uploads it to Dropbox.
 * Dropbox's simple upload endpoint needs a full buffer rather than a stream.
 * Uses refresh token for permanent auth — no manual token regeneration.
 * @param {NodeJS.ReadableStream} stream
 * @param {string} filename
 */
export async function uploadToDropbox(stream, filename) {
  if (!process.env.DROPBOX_APP_KEY || !process.env.DROPBOX_APP_SECRET || !process.env.DROPBOX_REFRESH_TOKEN) {
    throw new Error("DROPBOX_APP_KEY, DROPBOX_APP_SECRET, and DROPBOX_REFRESH_TOKEN must be set in .env");
  }

  const dbx = new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
    fetch,
  });

  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const result = await dbx.filesUpload({
    path: "/" + filename,
    contents: buffer,
    mode: { ".tag": "overwrite" },
  });

  console.log(`[Dropbox] Uploaded "${filename}"`);
  return { provider: "dropbox", location: result.result.path_display, name: filename };
}