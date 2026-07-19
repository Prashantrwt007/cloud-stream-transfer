import { google } from "googleapis";

/**
 * Returns a readable stream for a Google Drive file so it can be
 * piped straight into another cloud provider's upload call.
 * @param {import("googleapis").Auth.OAuth2Client} oauth2Client
 * @param {string} fileId
 */
export async function getDriveFileStream(oauth2Client, fileId) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return response.data;
}
