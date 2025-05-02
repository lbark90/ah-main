import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize GCS client
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'memorial-voices';
console.log(`Using GCS bucket: ${bucketName}`);

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const username = params.params[0];
    console.log(`Fetching photos for username: ${username}`);

    // Clean the username to prevent path traversal
    const cleanUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
    console.log(`Clean username: ${cleanUsername}`);

    // Access the GCS bucket
    const bucket = storage.bucket(bucketName);
    console.log(`Attempting to access bucket: ${bucketName}`);

    // Define paths for profile and gallery photos
    const profilePath = `${cleanUsername}/profile`;
    const galleryPath = `${cleanUsername}/gallery`;

    console.log(`Looking for profile photos in: ${profilePath}`);
    console.log(`Looking for gallery photos in: ${galleryPath}`);

    // Get profile photos
    const [profileFiles] = await bucket.getFiles({ prefix: profilePath });
    const profilePhotos = profileFiles.map(file => {
      // Create a signed URL that's valid for 1 hour
      const expiresAt = Date.now() + 3600000; // 1 hour in milliseconds
      return file.getSignedUrl({
        action: 'read',
        expires: expiresAt
      }).then(signedUrls => signedUrls[0]);
    });

    // Get gallery photos
    const [galleryFiles] = await bucket.getFiles({ prefix: galleryPath });
    const galleryPhotos = galleryFiles.map(file => {
      // Create a signed URL that's valid for 1 hour
      const expiresAt = Date.now() + 3600000; // 1 hour in milliseconds
      return file.getSignedUrl({
        action: 'read',
        expires: expiresAt
      }).then(signedUrls => signedUrls[0]);
    });

    // Wait for all promises to resolve
    const resolvedProfilePhotos = await Promise.all(profilePhotos);
    const resolvedGalleryPhotos = await Promise.all(galleryPhotos);

    console.log(`Profile files found: ${profileFiles.length}`);
    console.log(`Gallery files found: ${galleryFiles.length}`);

    // Return the photo URLs
    return NextResponse.json({
      profilePhotos: resolvedProfilePhotos,
      galleryPhotos: resolvedGalleryPhotos
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}