import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = 'memorial-voices';

export async function GET(request: Request) {
  try {
    // Get the userId from the URL query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing or invalid userId parameter' },
        { status: 400 }
      );
    }

    console.log(`Fetching profile for user: ${userId}`);

    try {
      const credentialsFile = storage.bucket(bucketName).file(`${userId}/credentials/login_credentials.json`);
      const [credContents] = await credentialsFile.download();
      const credStr = credContents.toString().trim();

      let profileData;
      try {
        profileData = JSON.parse(credStr);
      } catch (parseErr) {
        console.warn('Login credentials file is not valid JSON; using fallback values.');
        profileData = {
          firstName: 'Unknown',
          lastName: 'Unknown',
          dob: 'Unknown'
        };
      }

      return NextResponse.json({
        firstName: profileData.firstName || 'Unknown',
        lastName: profileData.lastName || 'Unknown',
        dob: profileData.dateOfBirth || 'Unknown',
        profileDocument: `${userId}/profile_description/${userId}_memorial_profile.txt`
      });
    } catch (err) {
      console.error('Error fetching profile from bucket:', err);
      return NextResponse.json(
        { error: 'Failed to fetch user profile from storage' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling user profile request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
