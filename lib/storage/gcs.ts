import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// Initialize storage with default credentials from the GCP VM
const storage = new Storage();

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
