import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple API to check if ElevenLabs API is configured correctly
 * without exposing the actual API key to the client
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check our environment for the API key
  const apiKey = process.env.ELEVENLABS_API_KEY || 
                 process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 
                 process.env.ELEVEN_LABS_API_KEY || 
                 process.env.NEXT_PUBLIC_ELEVEN_LABS_API;

  // Set the configured flag in the Next.js public environment at build time
  // to let clients know if the key should be available without exposing it
  if (apiKey) {
    return res.status(200).json({ 
      configured: true,
      message: "ElevenLabs API appears to be configured"
    });
  } else {
    return res.status(200).json({ 
      configured: false,
      message: "ElevenLabs API key not found in server environment"
    });
  }
}
