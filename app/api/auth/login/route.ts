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

    // Success case - modify this part
    const response = NextResponse.json(
      { message: "Login successful", user: { username } },
      { status: 200 }
    );

    // Set the cookie without redirecting to a specific username path
    response.cookies.set({
      name: "userId",
      value: username,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
