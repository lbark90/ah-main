import { Storage } from '@google-cloud/storage';
import fs from 'fs';

// Initialize GCS client with proper error handling
let storage: Storage;

try {
  // Check for the credentials file path in environment variables
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath && fs.existsSync(credentialsPath)) {
    console.log(`Using credentials from file: ${credentialsPath}`);
    storage = new Storage({ keyFilename: credentialsPath });
  } else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    // If credentials are provided as a JSON string in environment variable
    console.log('Using credentials from environment variable');
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    storage = new Storage({ credentials });
  } else {
    // Default credentials - will use Application Default Credentials
    console.log('Using default credentials');
    storage = new Storage();
  }

  console.log('Google Cloud Storage initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage:', error);
}

// Export the storage client and bucket name
export const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';
export { storage };

// Helper function to test authentication before operations
export async function testAuthentication() {
  try {
    // Try a simple operation to test auth
    await storage.getBuckets({ maxResults: 1 });
    return true;
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
}

// Upload a file to GCS
export async function uploadFile(file: Buffer | File | Blob, fileName: string): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(fileName);

  // Handle different file types
  if (file instanceof File || file instanceof Blob) {
    await blob.save(Buffer.from(await file.arrayBuffer()));
  } else {
    await blob.save(file);
  }

  // Generate signed URL for temporary access
  const [url] = await blob.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  });

  return url;
}

// Delete a file from GCS
export async function deleteFile(fileName: string) {
  try {
    console.log(`Deleting file: ${fileName}`);
    await storage.bucket(bucketName).file(fileName).delete();
    console.log('File deletion successful');
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// List files with a specific prefix
export async function listFiles(prefix: string): Promise<string[]> {
  const bucket = storage.bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix });
  return files.map(file => file.name);
}

// Helper function to check if a file exists in the bucket
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.warn(`Error checking if file ${filePath} exists:`, error);
    return false;
  }
}