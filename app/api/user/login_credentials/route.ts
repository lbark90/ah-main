import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'memorial-voices';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  // Return immediately if userId is undefined or empty
  if (!userId || userId === 'undefined') {
    return new NextResponse(JSON.stringify({
      error: 'Valid User ID is required',
      status: 'not_authenticated'
    }), {
      status: 200, // Return 200 to avoid error logs for non-authenticated states
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Correct path to the login_credentials.json file
    const credentialsPath = `${userId}/credentials/login_credentials.json`;
    console.log(`Checking for credentials file at path: ${credentialsPath}`);

    // Create a reference to the bucket
    const bucket = storage.bucket(bucketName);

    // Check if the file exists
    const [fileExists] = await bucket.file(credentialsPath).exists();
    if (!fileExists) {
      console.warn(`Credentials file not found at path: ${credentialsPath}`);
      return new NextResponse(JSON.stringify({ error: 'Credentials not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Download the file content
    const [fileContent] = await bucket.file(credentialsPath).download();
    const credentials = JSON.parse(fileContent.toString());
    console.log(`Fetched credentials for user ${userId}:`, credentials);

    return new NextResponse(JSON.stringify(credentials), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching login credentials:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch login credentials',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
