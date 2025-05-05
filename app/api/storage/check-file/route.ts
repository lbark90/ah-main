import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'memorial-voices';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  try {
    console.log(`Checking if file exists: ${filePath}`);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();

    return NextResponse.json({
      exists,
      filePath,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking file existence:', error);
    return NextResponse.json({
      error: 'Failed to check file existence',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
