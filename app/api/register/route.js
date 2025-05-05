import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Registration data received:', data);
    
    // Validate the required fields
    if (!data.email || !data.password) {
      return NextResponse.json(
        { message: 'Email and password are required' }, 
        { status: 400 }
      );
    }
    
    // Here you would typically:
    // 1. Check if user already exists
    // 2. Hash the password
    // 3. Save to database
    // 4. Create session/token
    
    // For debugging purposes, we'll simulate a successful registration
    return NextResponse.json(
      { success: true, message: 'Registration successful' },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Server error during registration:', error);
    return NextResponse.json(
      { message: 'Registration failed: ' + error.message },
      { status: 500 }
    );
  }
}
