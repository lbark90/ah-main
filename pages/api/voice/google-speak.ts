import type { NextApiRequest, NextApiResponse } from 'next';
import textToSpeech from '@google-cloud/text-to-speech';
import { Credentials } from 'google-auth-library';

type SpeakResponse = {
  audio?: string;
  error?: string;
  details?: string;
};

// Initialize the Google Text-to-Speech client
const initializeGoogleTTS = () => {
  try {
    // Use Application Default Credentials or explicit credentials
    // Note: For this to work, you need GOOGLE_APPLICATION_CREDENTIALS env var set
    // or credentials configured another way
    return new textToSpeech.TextToSpeechClient();
  } catch (error) {
    console.error('Failed to initialize Google TTS client:', error);
    throw error;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpeakResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, userId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing required parameter: text' });
  }

  console.log(`Google TTS request for user ${userId || 'unknown'}`);
  console.log(`Text length: ${text.length} chars`);

  try {
    // Create TTS client
    const client = initializeGoogleTTS();
    
    // Prepare the request
    const request = {
      input: { text },
      // Configure voice settings - using a female voice with neutral, natural speech
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',  // Neural voice for more natural sound
        ssmlGender: 'FEMALE'
      },
      // Configure audio settings
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,            // Default pitch
        speakingRate: 0.9,   // Slightly slower than normal
        volumeGainDb: 0      // Default volume
      },
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request as any);
    
    if (response.audioContent) {
      // Convert to base64 for transmission
      const audioBase64 = Buffer.from(response.audioContent as Buffer).toString('base64');
      console.log(`Successfully generated Google TTS speech (${audioBase64.length} bytes)`);
      return res.status(200).json({ audio: audioBase64 });
    } else {
      throw new Error('No audio content received from Google TTS API');
    }
  } catch (error) {
    console.error('Error in Google text-to-speech processing:', error);
    return res.status(500).json({ 
      error: 'Failed to process Google text-to-speech request',
      details: error.message
    });
  }
}
