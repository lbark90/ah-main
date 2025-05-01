
import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = 'memorial-voices';

// Initialize storage
const storage = new Storage({
  keyFilename: './credentials/gcp-credentials.json'
});

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const userFolder = params.path[0];
    const questionPathPart = params.path[params.path.length - 1];
    const questionNum = questionPathPart.replace('question', '');
    
    // Format expected: userFolder/recordings/recordings/questionX_*
    const prefix = `${userFolder}/recordings/recordings/question${questionNum}_`;
    console.log('Looking for recordings with prefix:', prefix);
    
    // List files in the directory to find the matching recording
    const [files] = await bucket.getFiles({
      prefix: prefix,
      autoPaginate: false,
      maxResults: 1
    });

    console.log('Found files:', files.map(f => f.name));

    if (!files || files.length === 0) {
      return new NextResponse('Recording not found', { status: 404 });
    }

    // Get the latest recording if multiple exists
    const file = files[0];
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return NextResponse.json(signedUrl);
  } catch (error) {
    console.error('Error getting recording:', error);
    return new NextResponse('Error getting recording', { status: 500 });
  }
}
