import { NextResponse } from 'next/server';
import { storage, bucketName } from '@/lib/storage/gcs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    console.log(`Attempting login for user: ${username}`);

    // Define the path to the credentials file
    const credentialsPath = `${username}/credentials/login_credentials.json`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(credentialsPath);

    // Check if the credentials file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`Credentials file not found for user: ${username}`);
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Fetch and validate the credentials
    console.log(`Downloading credentials file for user: ${username}`);
    const [content] = await file.download();
    const credentials = JSON.parse(content.toString());

    if (credentials.password !== password) {
      console.log(`Invalid password for user: ${username}`);
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    console.log(`Login successful for user: ${username}`);

    // Set up user data for response - using username consistently as the identifier
    const userData = {
      id: username, // This is the critical field - use the username directly
      username: username,
      firstName: credentials.firstName || '',
      lastName: credentials.lastName || '',
      email: credentials.email || '',
    };

    console.log(`Login successful. Setting user ID to: ${username}`);

    const response = NextResponse.json({
      message: "Login successful",
      user: userData
    }, { status: 200 });

    // Set the cookie with the username
    response.cookies.set({
      name: "userId", // Keep cookie name as userId for backward compatibility
      value: username,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
