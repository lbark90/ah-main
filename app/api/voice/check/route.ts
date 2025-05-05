import { NextRequest, NextResponse } from 'next/server';
import { storage, bucketName } from 'lib/storage/gcs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // Voice ID should be in {userId}/voice_id/voice_id.json
    const voiceIdPath = `${userId}/voice_id/voice_id.json`;
    console.log(`Looking for voice ID at path: ${voiceIdPath}`);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(voiceIdPath);

    const [exists] = await file.exists();
    if (!exists) {
      console.log(`Voice ID file not found at: ${voiceIdPath}`);
      return NextResponse.json(
        {
          exists: false,
          message: 'Voice ID not found'
        },
        { status: 200 }
      );
    }

    // Download and parse the voice ID file
    const [content] = await file.download();
    const voiceData = JSON.parse(content.toString());

    // Return the voice ID
    return NextResponse.json({
      exists: true,
      voiceId: voiceData.voiceId || voiceData.voice_id || null,
      isElevenLabsVoice: voiceData.isElevenLabsVoice || true
    });
  } catch (error) {
    console.error('Error checking voice ID:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve voice ID',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
