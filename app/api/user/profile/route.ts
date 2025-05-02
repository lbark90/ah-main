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
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Updated path to match the login credentials path structure
    const metadataPath = `${userId}/credentials/login_credentials.json`;
    console.log(`Checking for metadata file at path: ${metadataPath}`);

    // Create a reference to the bucket
    const bucket = storage.bucket(bucketName);

    // Fetch metadata from login_credentials.json
    const [metadataExists] = await bucket.file(metadataPath).exists();
    if (!metadataExists) {
      console.warn(`Metadata file not found at path: ${metadataPath}`);
      return new NextResponse(JSON.stringify({
        error: 'User profile not found. Please log in again.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const [metadataContent] = await bucket.file(metadataPath).download();
    const metadata = JSON.parse(metadataContent.toString());

    // Build profile document path
    const profileDocumentPath = `${userId}/profile_description/${userId}_memorial_profile.txt`;

    return NextResponse.json({
      userId,
      firstName: metadata?.firstName || 'Unknown',
      lastName: metadata?.lastName || 'User',
      dob: metadata?.dateOfBirth || 'N/A',
      profileDocumentPath: profileDocumentPath
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to fetch user profile',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
