import { NextResponse } from 'next/server';
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

  console.log('Google Cloud Storage initialized successfully for delete operations');
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage for delete operations:', error);
}

// Helper function to test authentication before operations
async function testAuthentication() {
  try {
    // Try a simple operation to test auth
    await storage.getBuckets({ maxResults: 1 });
    return true;
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Test authentication first
    const authValid = await testAuthentication();
    if (!authValid) {
      return NextResponse.json(
        { success: false, message: 'Google Cloud authentication failed. Check credentials.' },
        { status: 500 }
      );
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: 'File path is required' },
        { status: 400 }
      );
    }

    // Always use memorial-voices bucket
    const bucketName = 'memorial-voices';
    console.log(`Using GCS bucket: ${bucketName}`);

    // Get bucket reference
    const bucket = storage.bucket(bucketName);

    // Check if file exists
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      return NextResponse.json(
        { success: false, message: `File ${filePath} not found` },
        { status: 404 }
      );
    }

    console.log(`Deleting file: ${filePath}`);

    // Delete the file
    await file.delete();

    console.log(`Successfully deleted file: ${filePath}`);

    return NextResponse.json(
      {
        success: true,
        message: 'File deleted successfully',
        path: filePath
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting file:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete file',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
