import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // Create a JWT token that might be more compatible with the webhook service
    const secretKey = process.env.WEBHOOK_SECRET || 'development-webhook-secret';

    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iss: 'ah-webhook-sender',
      sub: 'webhook-auth',
    };

    const token = jwt.sign(payload, secretKey);

    console.log('Generated JWT token for webhook authorization');

    return NextResponse.json({
      token,
      source: 'jwt-development',
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('Error generating token:', error);

    // Return a fallback token
    return NextResponse.json({
      token: 'mock-fallback-token',
      error: error instanceof Error ? error.message : String(error),
      source: 'error-fallback'
    });
  }
}
