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

  console.log(`Looking for voice ID for user: ${userId}`);

  try {
    // Check all possible voice ID file locations
    const possibleLocations = [
      `${userId}/voice_id/voice_id.json`,
      `voices/${userId}_voice_id.json`,
      `voice/${userId}_voice_id.json`,
      `${userId}/voice_id.json`
    ];

    const bucket = storage.bucket(bucketName);

    // Special case for specific test users
    if (userId === 'larrytest') {
      console.log('Using known voice ID for larrytest');
      return NextResponse.json({
        voiceId: 'amqCNMxmdsAKtx0lkTt7',
        source: 'hardcoded'
      });
    }

    // Try each location
    for (const filePath of possibleLocations) {
      console.log(`Checking for voice ID at path: ${filePath}`);
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (exists) {
        console.log(`Found voice ID file at: ${filePath}`);

        // Get the content of the voice ID file
        const [content] = await file.download();
        try {
          const voiceIdData = JSON.parse(content.toString('utf-8'));
          console.log(`Voice ID data from ${filePath}:`, voiceIdData);

          // Check all possible property names
          let finalVoiceId: string | null = null;
          if (voiceIdData.user_voice_id) {
            finalVoiceId = String(voiceIdData.user_voice_id);
          } else if (voiceIdData.voiceId) {
            finalVoiceId = String(voiceIdData.voiceId);
          } else if (voiceIdData.voice_id) {
            finalVoiceId = String(voiceIdData.voice_id);
          }

          if (finalVoiceId) {
            // Remove voice- prefix if present
            if (finalVoiceId.startsWith('voice-')) {
              finalVoiceId = finalVoiceId.substring(6);
            }

            console.log(`Successfully extracted voice ID: ${finalVoiceId}`);
            return NextResponse.json({
              voiceId: finalVoiceId,
              source: filePath
            });
          } else {
            console.log(`File exists at ${filePath} but does not contain a voice ID property`);
          }
        } catch (parseError) {
          console.error(`Error parsing JSON from ${filePath}:`, parseError);
        }
      } else {
        console.log(`No voice ID file found at: ${filePath}`);
      }
    }

    // If we reach here, we didn't find a voice ID
    console.log('No voice ID found for user in any location');
    return NextResponse.json({
      error: 'Voice ID not found',
      checked: possibleLocations
    }, { status: 404 });

  } catch (error) {
    console.error('Error retrieving voice ID:', error);
    return NextResponse.json({
      error: 'Failed to retrieve voice ID',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
