
import { generateJWTToken } from '../../../../lib/utils/jwt';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = await generateJWTToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
