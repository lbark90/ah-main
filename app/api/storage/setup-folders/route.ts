
import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';

const storage = new Storage({
  keyFilename: './credentials/gcp-credentials.json'
});

const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'your-bucket-name';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();
    const bucket = storage.bucket(BUCKET_NAME);

    // Create user folder structure using email
    const userFolderName = encodeURIComponent(email);
    
    // Create necessary folders
    await bucket.file(`${userFolderName}/recordings/`).save('');
    await bucket.file(`${userFolderName}/photos/`).save('');
    await bucket.file(`${userFolderName}/profile/`).save('');
    await bucket.file(`${userFolderName}/gallery/`).save('');
    await bucket.file(`${userFolderName}/voice/`).save('');
    await bucket.file(`${userFolderName}/credentials/`).save('');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting up folders:', error);
    return NextResponse.json({ success: false, error: 'Failed to setup folders' }, { status: 500 });
  }
}
