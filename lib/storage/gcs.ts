import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// Bucket name from environment variable with fallback
export const bucketName = process.env.GCS_BUCKET_NAME || 'memorial-voices';

// Initialize Storage with default credentials (will use VM's service account)
export const storage = new Storage();

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
