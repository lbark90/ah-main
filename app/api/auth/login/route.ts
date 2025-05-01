import { NextResponse } from 'next/server';
import { storage, bucketName } from '@/lib/storage/gcs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Define the path to the credentials file
    const credentialsPath = `${username}/credentials/login_credentials.json`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(credentialsPath);

    // Check if the credentials file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Fetch and validate the credentials
    const [content] = await file.download();
    const credentials = JSON.parse(content.toString());

    if (credentials.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: credentials.userId,
        username: credentials.userId,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        email: credentials.email,
      },
    });
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
