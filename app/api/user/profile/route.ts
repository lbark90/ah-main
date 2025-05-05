import { NextResponse } from 'next/server';

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

    // In a production environment, you would fetch this from a database
    // For now, we're returning default values to unblock the conversation UI
    // You can enhance this with actual database integration later

    return NextResponse.json({
      firstName: '',
      lastName: '',
      dob: '',
      profileDocument: ''
    });
  } catch (error) {
    console.error('Error handling user profile request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
