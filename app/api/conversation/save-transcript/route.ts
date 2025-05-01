import { NextResponse } from 'next/server';
import { storage, bucketName } from '@/lib/storage/gcs';

export async function POST(request: Request) {
  try {
    const { userId, transcript, timestamp } = await request.json();

    if (!userId || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const currentDate = timestamp || new Date().toISOString();
    const formattedDate = currentDate.replace(/[:.]/g, '-');

    const transcriptData = {
      userId,
      transcript,
      timestamp: currentDate,
    };

    try {
      console.log(`Saving transcript for user ${userId}`);
      const filePath = `${userId}/conversations/transcript_${formattedDate}.json`;
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);

      await file.save(JSON.stringify(transcriptData, null, 2), {
        contentType: 'application/json',
      });

      console.log(`Transcript saved to ${filePath}`);
      return NextResponse.json({
        success: true,
        message: 'Transcript saved successfully',
        path: filePath,
      });
    } catch (storageError) {
      console.error('Error saving to GCP:', storageError);
      return NextResponse.json(
        { error: 'Failed to save transcript to storage', details: storageError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing transcript save request:', error);
    return NextResponse.json(
      { error: 'Failed to process transcript save request' },
      { status: 500 }
    );
  }
}
