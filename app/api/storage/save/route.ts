import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

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

    const { data } = await request.json();

    // Extract username from the data
    const username = data.userId || data.username;

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    console.log(`Processing registration for username: ${username}`);

    // Always use memorial-voices bucket
    const bucketName = 'memorial-voices';
    console.log(`Using GCS bucket: ${bucketName}`);

    // Get bucket reference
    const bucket = storage.bucket(bucketName);

    // Check if bucket exists
    const [bucketExists] = await bucket.exists();
    if (!bucketExists) {
      console.error(`Bucket ${bucketName} does not exist`);
      return NextResponse.json(
        { success: false, message: `Storage bucket ${bucketName} not found` },
        { status: 404 }
      );
    }

    // Check if username already exists to avoid conflicts
    try {
      const [files] = await bucket.getFiles({ prefix: `${username}/` });

      if (files.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Username already exists. Please choose another username.' },
          { status: 409 } // Conflict
        );
      }
    } catch (error) {
      console.error('Error checking for existing username:', error);
      // Continue if error is just "folder not found"
    }

    // Create proper folder structure: username/credentials/login_credentials.json
    const objectKey = `${username}/credentials/login_credentials.json`;
    console.log(`Creating user folder structure with key: ${objectKey}`);

    // Create a new blob in the bucket
    const blob = bucket.file(objectKey);

    // Convert data to string
    const content = JSON.stringify(data, null, 2);

    // Upload the content
    await blob.save(content, {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'no-cache',
      }
    });

    console.log(`Successfully saved user credentials to ${objectKey} in ${bucketName}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        path: objectKey,
        userId: username
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving data to GCS:', error);

    // Detailed error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save user data to storage',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
