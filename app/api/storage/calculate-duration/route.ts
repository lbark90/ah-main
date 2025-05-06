import { NextResponse } from 'next/server';
import { storage } from '../../../../lib/storage/gcs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const bucket = storage.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME || '');
    const userFolder = `${userId}/recordings`;

    let totalDuration = 0;

    const [files] = await bucket.getFiles({ prefix: userFolder });

    return NextResponse.json({ duration: files.length * 60 }); // Estimate 60 seconds per recording

  } catch (error) {
    console.error('Error calculating duration:', error);
    return NextResponse.json({ error: 'Failed to calculate duration' }, { status: 500 });
  }
}
