
import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'credentials', 'gcp-credentials.json')
});

const bucketName = 'memorial-voices';

export async function uploadFile(fileBuffer: Buffer, folderPath: string, fileName: string) {
  const bucket = storage.bucket(bucketName);
  const fullPath = `${folderPath}/${fileName}`;
  const file = bucket.file(fullPath);
  
  try {
    await file.save(fileBuffer);
    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error uploading to GCP:', error);
    throw error;
  }
}

export async function ensureFolderExists(folderPath: string) {
  const bucket = storage.bucket(bucketName);
  try {
    // Creating an empty file to ensure folder exists
    const folderFile = bucket.file(`${folderPath}/.keep`);
    await folderFile.save('');
    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}
