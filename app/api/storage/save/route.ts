
import { NextResponse } from 'next/server';
import { storage, bucketName } from '@/lib/storage/gcs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: filePath, content } = body;
    
    if (!filePath || !content) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // If this is a credentials file, enhance the content with timestamps
    if (filePath.includes('credentials/login_credentials.json')) {
      const now = new Date().toISOString();
      const enhancedContent = {
        ...content,
        created_at: now,
        last_modified: now
      };
      
      await file.save(JSON.stringify(enhancedContent, null, 2), {
        contentType: 'application/json',
      });
    } else {
      await file.save(JSON.stringify(content, null, 2), {
        contentType: 'application/json',
      });
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
