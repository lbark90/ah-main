import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'memorial-voices';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'User ID is required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Build paths for metadata
    const metadataPath = `${userId}/login_credentials.json`;

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
