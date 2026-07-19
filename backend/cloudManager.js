import { uploadToDropbox } from "./clouds/dropbox.js";
import { uploadToOneDrive } from "./clouds/onedrive.js";
import { uploadToS3 } from "./clouds/s3.js";

const uploaders = {
  dropbox: uploadToDropbox,
  onedrive: uploadToOneDrive,
  s3: uploadToS3,
};

/**
 * Dispatches a file stream to the requested cloud provider.
 * @param {"dropbox"|"onedrive"|"s3"} destination
 * @param {NodeJS.ReadableStream} stream
 * @param {string} filename
 */
export async function uploadToCloud(destination, stream, filename) {
  const uploader = uploaders[destination];

  if (!uploader) {
    throw new Error(`Invalid destination cloud: "${destination}"`);
  }

  console.log(`Uploading "${filename}" -> ${destination}`);
  return uploader(stream, filename);
}
