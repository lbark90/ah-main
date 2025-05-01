import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse the request body
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString());

  // Extract request data
  const { text, voiceId, userId, chunkInfo = {}, settings = {} } = body;
  
  // Extract chunk details
  const { 
    sequenceIndex = 0, 
    isFirstChunk = sequenceIndex === 0, 
    isLastChunk = false,
    messageIndex = 0
  } = chunkInfo;
  
  const { 
    reducedFillers = true, 
    isPartOfSequence = false 
  } = settings;

  // Validate required parameters
  if (!text) {
    return res.status(400).json({ error: 'Missing required parameter: text' });
  }
  if (!voiceId) {
    return res.status(400).json({ error: 'Missing required parameter: voiceId' });
  }
  
  // Get API key
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 
                           process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'API key is missing' });
  }

  try {
    console.log(`Streaming TTS for chunk ${sequenceIndex} of message ${messageIndex}`);
    console.log(`Text length: ${text.length} chars, text: "${text.substring(0, 30)}..."`);

    // Optimize speech rate based on sequence position
    const speechRate = isPartOfSequence 
      ? (isFirstChunk ? 0.88 : 0.93) 
      : 0.88;

    // Call ElevenLabs streaming API
    const streamUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
    const elevenlabsRes = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: isPartOfSequence ? 0.38 : 0.35,
          similarity_boost: 0.68,
          style: 0.12,
          use_speaker_boost: true,
          speaking_rate: speechRate,
          pause_frequency: isFirstChunk ? 0.2 : 0.1,
          clarity: 0.85,
          pause_length: isPartOfSequence ? 0.2 : 0.4,
          pronunciation_clarity: 0.9
        }
      })
    });

    if (!elevenlabsRes.ok) {
      console.error(`ElevenLabs streaming API error: ${elevenlabsRes.status}`);
      return res.status(elevenlabsRes.status).json({ 
        error: `ElevenLabs API error: ${elevenlabsRes.statusText}`
      });
    }

    // Set appropriate headers for streaming audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Stream the audio directly to client
    if (!elevenlabsRes.body) {
      throw new Error('Response body is null');
    }
    const reader = elevenlabsRes.body.getReader();
    
    // Process and forward the stream to client
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Write chunk to response
      res.write(value);
    }
    
    res.end();
    console.log(`Completed streaming for chunk ${sequenceIndex}`);
    
  } catch (error) {
    console.error('Error in streaming TTS:', error);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to process streaming request',
        details: error.message 
      });
    } else {
      res.end();
    }
  }
}
