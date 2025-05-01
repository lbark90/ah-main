
import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import path from 'path';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'credentials', 'gcp-credentials.json')
});

const bucketName = 'memorial-voices';

export async function POST(request: Request) {
  try {
    const { userName, questionIndex, type } = await request.json();
    const bucket = storage.bucket(bucketName);
    
    // List files in the recordings folder for this user and question
    const [files] = await bucket.getFiles({ 
      prefix: `${userName}/recordings/${questionIndex}`
    });

    // Delete all existing files
    await Promise.all(files.map(file => file.delete()));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
}
