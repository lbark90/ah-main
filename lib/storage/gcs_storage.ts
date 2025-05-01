
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';

export async function uploadRecording(file: File, fileName: string): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(fileName);
  
  await blob.save(await file.arrayBuffer());
  
  // Generate signed URL for temporary access
  const [url] = await blob.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  });
  
  return url;
}

export async function deleteRecording(fileName: string): Promise<void> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  await file.delete();
}

export async function listRecordings(prefix: string): Promise<string[]> {
  const bucket = storage.bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix });
  return files.map(file => file.name);
}
