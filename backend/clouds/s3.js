import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

/**
 * Streams a file into an S3 bucket.
 * @param {NodeJS.ReadableStream} stream
 * @param {string} filename
 */
export async function uploadToS3(stream, filename) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filename,
    Body: stream,
    ContentType: "application/octet-stream",
  };

  const result = await s3.upload(params).promise();
  console.log(`[S3] Uploaded "${filename}" -> ${result.Location}`);
  return { provider: "s3", location: result.Location, name: filename };
}
