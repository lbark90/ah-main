import { NextResponse } from "next/server";
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

const storage = new Storage();  // Use default credentials
const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';

export async function GET(
  request: NextRequest,
  context: { params: { params: string[] } },
) {
  try {
    const params = context.params?.params || [];

    if (!params || !Array.isArray(params) || params.length < 1) {
      return new Response("Missing parameters", { status: 400 });
    }

    const [username] = params;
    console.log("Fetching photos for username:", username);
    const cleanUsername = decodeURIComponent(username)
      .replace("_", "")
      .toLowerCase();
    console.log("Clean username:", cleanUsername);

    if (!storage || !bucketName) {
      console.error("Storage not properly initialized");
      return NextResponse.json(
        { error: "Storage configuration error" },
        { status: 500 }
      );
    }

    const bucket = storage.bucket(bucketName);
    console.log("Attempting to access bucket:", bucketName);

    try {
      // Define prefixes
      const profilePrefix = `${cleanUsername}/profile`;
      const galleryPrefix = `${cleanUsername}/gallery`;

      console.log("Looking for profile photos in:", profilePrefix);
      console.log("Looking for gallery photos in:", galleryPrefix);

      // Get profile photo
      const [profileFiles] = await bucket.getFiles({ prefix: profilePrefix });
      console.log("Profile files found:", profileFiles.length);

      // Get gallery photos
      const [galleryFiles] = await bucket.getFiles({ prefix: galleryPrefix });
      console.log("Gallery files found:", galleryFiles.length);

      // Get signed URLs for all photos
      const getSignedUrls = async (files: any[]) => {
        return Promise.all(
          files.map(async (file) => {
            const [url] = await file.getSignedUrl({
              action: "read",
              expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            });
            return url;
          })
        );
      };

      const [profileUrls, galleryUrls] = await Promise.all([
        getSignedUrls(profileFiles),
        getSignedUrls(galleryFiles),
      ]);

      return NextResponse.json({
        photos: galleryUrls,
        profilePhoto: profileUrls[0] || null,
      });
    } catch (error) {
      console.error("Error fetching photos from bucket:", error);
      return NextResponse.json(
        { error: "Error fetching photos from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Error fetching photos" },
      { status: 500 },
    );
  }
}