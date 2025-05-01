
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// Initialize storage with better error handling
let storage;
try {
  const credPath = path.join(process.cwd(), 'google_credentials.json');
  console.log(`Looking for Google credentials at: ${credPath}`);
  
  if (fs.existsSync(credPath)) {
    console.log('Google credentials file found');
    storage = new Storage({
      keyFilename: credPath
    });
  } else {
    console.error('Google credentials file not found!');
    // Try using environment variables
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using GOOGLE_APPLICATION_CREDENTIALS environment variable');
      storage = new Storage();
    } else if (process.env.GOOGLE_CREDENTIALS) {
      console.log('Creating credentials from GOOGLE_CREDENTIALS environment variable');
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      storage = new Storage({ credentials });
    } else {
      console.error('No Google credentials found in environment either!');
      storage = new Storage(); // This will likely fail, but we'll handle the error later
    }
  }
} catch (error) {
  console.error('Error initializing Google Cloud Storage:', error);
  // Create a minimal storage object that will report errors properly
  storage = {
    bucket: (name) => ({
      file: (path) => ({
        exists: async () => [false],
        download: async () => { throw new Error('Storage not properly initialized'); },
        save: async () => { throw new Error('Storage not properly initialized'); }
      }),
      upload: async () => { throw new Error('Storage not properly initialized'); }
    })
  };
}

const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';
console.log(`Using GCS bucket: ${bucketName}`);

export { storage, bucketName };

export async function uploadFile(filePath: string, destination: string) {
  try {
    console.log(`Uploading file from ${filePath} to ${destination}`);
    await storage.bucket(bucketName).upload(filePath, {
      destination: destination,
    });
    console.log('File upload successful');
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    return false;
  }
}

export async function downloadFile(fileName: string, destination: string) {
  try {
    console.log(`Downloading file from ${fileName} to ${destination}`);
    await storage.bucket(bucketName).file(fileName).download({
      destination: destination,
    });
    console.log('File download successful');
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
}

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

export async function fileExists(fileName: string) {
  try {
    console.log(`Checking if file exists: ${fileName}`);
    const [exists] = await storage.bucket(bucketName).file(fileName).exists();
    console.log(`File exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

export async function listFiles(prefix: string) {
  try {
    console.log(`Listing files with prefix: ${prefix}`);
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });
    return files.map(file => file.name);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}
