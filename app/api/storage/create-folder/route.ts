
import { NextResponse } from 'next/server';
import { storage, bucketName } from '@/lib/storage/gcs';

export async function POST(request: Request) {
  try {
    const { path: folderPath } = await request.json();
    
    if (!folderPath) {
      return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
    }

    const bucket = storage.bucket(bucketName);
    const folderFile = bucket.file(`${folderPath}/.keep`);
    await folderFile.save('');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
