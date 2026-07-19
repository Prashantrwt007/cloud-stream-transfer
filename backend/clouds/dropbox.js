import { Dropbox } from "dropbox";
import fetch from "node-fetch";

/**
 * Buffers the incoming stream and uploads it to Dropbox.
 * Dropbox's simple upload endpoint needs a full buffer rather than a stream.
 * @param {NodeJS.ReadableStream} stream
 * @param {string} filename
 */
export async function uploadToDropbox(stream, filename) {
  if (!process.env.DROPBOX_ACCESS_TOKEN) {
    throw new Error("DROPBOX_ACCESS_TOKEN is not set in .env");
  }

  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch });

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
