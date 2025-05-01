import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'credentials', 'gcp-credentials.json'),
});
const bucketName = 'memorial-voices';

export async function POST(request: Request) {
  console.log("=============== UPLOAD REQUEST STARTED ===============");
  try {
    const formData = await request.formData();
    console.log("Form data received with fields:", Array.from(formData.keys()));

    const audio = formData.get('audio') as Blob;
    const questionIndex = formData.get('questionIndex') as string;
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as string;

    if (!audio || !userId || !type) {
      console.error('Missing required fields:', {
        hasAudio: !!audio,
        hasUserId: !!userId,
        hasType: !!type,
        questionIndex: questionIndex || 'N/A'
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log file details
    console.log("File details:", {
      name: (audio as any).name, // May be undefined in some browsers
      type: audio.type,
      size: audio.size,
    });

    // Get the file data as buffer
    const fileBuffer = Buffer.from(await audio.arrayBuffer());
    console.log(`File buffer created with size: ${fileBuffer.length} bytes`);

    if (fileBuffer.length === 0) {
      console.error('Empty file buffer received');
      return NextResponse.json({ error: 'Empty file received' }, { status: 400 });
    }

    // Create a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = (audio.type.startsWith('image/')) ? 
      (audio.type === 'image/jpeg' ? 'jpg' : audio.type.split('/')[1]) : 'mp3';

    const fileName = `${userId}_${type}_${timestamp}.${fileExtension}`;

    // Use encoded userId for folder path
    const encodedUserId = encodeURIComponent(userId);
    
    // Determine the folder path based on the type
    let folderPath;
    if (type === 'profile-photo') {
      folderPath = `${encodedUserId}/profile`;
    } else if (type === 'gallery') {
      folderPath = `${encodedUserId}/gallery`;
    } else if (type === 'recording') {
      // For recordings, use the question index to create a folder structure
      folderPath = `${encodedUserId}/recordings/${questionIndex}`;
    } else {
      // Default case, use a generic path
      folderPath = `${encodedUserId}/${type}`;
    }

    const filePath = `${folderPath}/${fileName}`;
    console.log(`Attempting to save file to: ${filePath}`);
    console.log(`Content type: ${audio.type || 'application/octet-stream'}`);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Try to save the file with minimal options
    try {
      await file.save(fileBuffer, {
        metadata: {
          contentType: audio.type || 'application/octet-stream',
        },
      });
      console.log("File saved successfully to GCP");
    } catch (saveError) {
      console.error('Error saving file to GCP:', saveError);
      return NextResponse.json({ 
        error: 'Failed to save file to storage', 
        details: saveError.message 
      }, { status: 500 });
    }

    // Skip signed URL generation and use public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
    console.log("Using public URL:", publicUrl);

    console.log("============ UPLOAD COMPLETED SUCCESSFULLY ============");
    return NextResponse.json({ 
      success: true, 
      filePath,
      url: publicUrl
    });
  } catch (error) {
    console.error('Unhandled error in upload route:', error);
    return NextResponse.json({ 
      error: 'Failed to process upload', 
      details: error.message 
    }, { status: 500 });
  }
}