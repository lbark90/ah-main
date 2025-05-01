
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Store reset tokens (in a real app, this would be in a database)
const resetTokens = new Map<string, {email: string, expires: Date}>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
    
    // Store token (in real app, store in database)
    resetTokens.set(token, { email, expires });
    
    // Get base URL for reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password/${token}`;
    
    // In a real app, send email here
    console.log('Reset link:', resetLink);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
