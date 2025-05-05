import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the auth cookie
    response.cookies.set({
      name: 'userId',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in logout route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
