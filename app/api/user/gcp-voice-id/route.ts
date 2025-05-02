import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'memorial-voices';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  try {
    console.log(`Looking for voice ID for user: ${userId}`);

    // Check for voice ID file in the user's folder using the correct path
    const filePath = `${userId}/voice_id/voice_id.json`;
    console.log(`Checking for voice ID at path: ${filePath}`);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();

    if (!exists) {
      console.log(`Voice ID file not found at path: ${filePath}`);
      return NextResponse.json({ error: 'Voice ID file not found' }, { status: 404 });
    }

    // Get the content of the voice ID file
    const [content] = await file.download();
    const voiceIdData = JSON.parse(content.toString('utf-8'));

    console.log("Voice ID data:", JSON.stringify(voiceIdData));

    // Check for various possible property names
    let finalVoiceId: string | null = null;
    if (voiceIdData.user_voice_id) {
      finalVoiceId = voiceIdData.user_voice_id;
      console.log(`Found voice ID in 'user_voice_id' property: ${finalVoiceId}`);
    } else if (voiceIdData.voiceId) {
      finalVoiceId = voiceIdData.voiceId;
      console.log(`Found voice ID in 'voiceId' property: ${finalVoiceId}`);
    } else if (voiceIdData.voice_id) {
      finalVoiceId = voiceIdData.voice_id;
      console.log(`Found voice ID in 'voice_id' property: ${finalVoiceId}`);
    }

    if (!finalVoiceId) {
      console.error('No voice ID property found in file. Data:', JSON.stringify(voiceIdData));
      return NextResponse.json({
        error: 'No valid voice ID property found in file',
        data: voiceIdData
      }, { status: 500 });
    }

    // Remove the "voice-" prefix if it exists
    if (finalVoiceId.startsWith('voice-')) {
      finalVoiceId = finalVoiceId.substring(6); // Remove 'voice-' prefix
    }

    console.log(`Retrieved voice ID from bucket: ${finalVoiceId}`);

    return NextResponse.json({
      voiceId: finalVoiceId,
      source: 'gcp-bucket'
    });
  } catch (error) {
    console.error('Error retrieving voice ID from bucket:', error);
    return NextResponse.json({
      error: 'Failed to retrieve voice ID',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
