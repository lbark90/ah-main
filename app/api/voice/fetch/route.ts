import { NextResponse } from 'next/server';
import { storage } from '../../../../lib/storage/gcs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const voiceId = url.searchParams.get('voiceId');

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID required' }, { status: 400 });
    }

    const bucket = storage.bucket('memorial-voices');
    const file = bucket.file(`voices/${voiceId}.wav`);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'Voice file not found' }, { status: 404 });
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error fetching voice:', error);
    return NextResponse.json({ error: 'Failed to fetch voice file' }, { status: 500 });
  }
}
