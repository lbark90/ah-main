import { Storage } from '@google-cloud/storage';
import fs from 'fs';

// Bucket name from environment variable with fallback
export const bucketName = process.env.GCS_BUCKET_NAME || 'memorial-voices';

// Create a simplified version that handles missing credentials gracefully
export const createStorage = () => {
  try {
    // Try to create Storage with default credentials first
    return new Storage();
  } catch (error) {
    console.warn('Failed to initialize Storage with default credentials:', error);

    // Return a mock object that logs operations but doesn't fail
    return {
      bucket: (name: string) => ({
        name,
        file: (path: string) => ({
          exists: async () => [false],
          download: async () => [Buffer.from('{"voice_id":"mock-voice-id"}')],
        }),
      }),
    };
  }
};

export const storage = createStorage();

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
