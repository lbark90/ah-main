import { NextResponse } from 'next/server';
import { storage, bucketName } from '../../../../lib/storage/gcs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user');

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    // First get the user's credentials to get their userId
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: 'lbark1990/credentials/' });
    const credentialsFile = files.find(f => f.name.endsWith('login_credentials.json'));

    if (!credentialsFile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [content] = await credentialsFile.download();
    const credentials = JSON.parse(content.toString());

    // Now list files using the userId
    const [recordings] = await bucket.getFiles({ prefix: `${credentials.userId}/recordings/` });
    const audioFiles = recordings.map(file => file.name);

    return NextResponse.json({ files: audioFiles });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}