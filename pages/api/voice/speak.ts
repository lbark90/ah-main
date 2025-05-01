import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

type SpeakResponse = {
  audio?: string; // Base64 encoded audio
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpeakResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract request data with priority support
  const { text, voiceId, userId, priority = "normal", apiKey: clientApiKey, chunkInfo = {}, settings = {} } = req.body;

  // Extract chunk context for better speech pacing
  const { 
    sequenceIndex = 0, 
    isFirstChunk = true, 
    isLastChunk = false 
  } = chunkInfo;
  
  const { 
    reducedFillers = true, 
    naturalTiming = true, 
    isPartOfSequence = false 
  } = settings;

  // Log chunk information for debugging
  console.log(`ElevenLabs TTS request for user ${userId || 'unknown'}, voice ${voiceId} ${
    chunkInfo ? `(chunk ${sequenceIndex}${isFirstChunk ? " - first" : ""}${isLastChunk ? " - last" : ""})` : ''
  }`);
  console.log(`Text length: ${text?.length || 0} chars, priority: ${priority || 'normal'}`);
  
  // Validate required parameters
  if (!text) {
    return res.status(400).json({ error: 'Missing required parameter: text' });
  }
  if (!voiceId) {
    return res.status(400).json({ error: 'Missing required parameter: voiceId' });
  }

  // Get API key from multiple sources with better logging
  const ELEVENLABS_API_KEY = clientApiKey || 
                            process.env.ELEVENLABS_API_KEY || 
                            process.env.ELEVEN_LABS_API ||
                            process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  
  if (!ELEVENLABS_API_KEY) {
    console.error('⚠️ ElevenLabs API key is missing from all possible sources');
    return res.status(500).json({ 
      error: 'API key is missing', 
      details: 'ElevenLabs API key is not available in any environment variable or request' 
    });
  }

  console.log('✓ Using ElevenLabs API key from:',
    clientApiKey ? 'client request' : 
    process.env.ELEVENLABS_API_KEY ? 'ELEVENLABS_API_KEY' :
    process.env.ELEVEN_LABS_API ? 'ELEVEN_LABS_API' :
    'NEXT_PUBLIC_ELEVENLABS_API_KEY'
  );

  try {
    // Get the actual voice ID - try to look it up if needed
    let finalVoiceId = voiceId;
    let usedVoiceIdSource = 'passed';
    
    // Only try to find voice_id.json if we need to (don't do it if we already have a valid ID)
    if (userId && (
        !finalVoiceId || 
        finalVoiceId.includes('Creating voice') || 
        finalVoiceId.length < 10 || 
        finalVoiceId === userId
    )) {
      try {
        const voiceIdResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/voice/id?userId=${userId}`);
        
        if (voiceIdResponse.ok) {
          const voiceData = await voiceIdResponse.json();
          if (voiceData.voiceId && voiceData.found) {
            finalVoiceId = voiceData.voiceId;
            usedVoiceIdSource = 'api';
            console.log(`Using voice ID from API: ${finalVoiceId}`);
          } else {
            // If the voice API returned no voice, return error
            return res.status(404).json({ 
              error: 'No voice found for this user',
              details: voiceData.error || 'Please create a voice first' 
            });
          }
        } else {
          // If the voice API call failed, return error
          return res.status(404).json({ 
            error: 'Failed to fetch voice data',
            details: 'Voice lookup API returned an error'
          });
        }
      } catch (voiceError) {
        console.error("Error fetching voice ID:", voiceError);
        return res.status(500).json({ 
          error: 'Failed to fetch voice data',
          details: voiceError.message
        });
      }
    }
    
    // Validate the voice ID format
    const isValidVoiceId = /^[A-Za-z0-9]{10,}$/.test(finalVoiceId);
    
    // If not valid, return error
    if (!isValidVoiceId) {
      return res.status(400).json({ 
        error: 'Invalid voice ID format',
        details: `The voice ID "${finalVoiceId}" is not in the correct format for ElevenLabs`
      });
    }

    console.log(`Making streaming request to ElevenLabs with voice ID: ${finalVoiceId}`);

    // Adjust speech timing based on chunk position
    if (isPartOfSequence) {
      if (isFirstChunk) {
        // First chunks: start naturally with minimal pauses
        const modifiedText = text.replace(/^([A-Za-z]+)\s/, '$1, '); // Add slight pause after first word
      } else {
        // Middle chunks: ensure smooth transition from previous chunk
        const modifiedText = text
          // Remove leading conjunctions that might create awkwardness
          .replace(/^(and|but|or|so|because|however|therefore)\s+/i, '')
          // Add very slight pause after first word for rhythm
          .replace(/^([A-Za-z]+)\s/, '$1, ');
      }
    }
    
    // For sequential speech, avoid patterns that cause awkward timing
    if (reducedFillers) {
      const modifiedText = text
        // Remove direct filler words
        .replace(/\b(um|uh|er|ah|like,|you know,)\b/gi, '')
        // Replace multiple spaces with single space
        .replace(/\s{2,}/g, ' ');
    }
    
    // When sequential, use fewer pauses between chunks
    const speechRate = isPartOfSequence 
      ? (isFirstChunk ? 0.88 : 0.93) // Slightly faster for continuing chunks 
      : 0.88;                        // Normal rate for standalone/first chunks

    // Call the ElevenLabs STREAMING API for better performance
    const streamUrl = `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}/stream`;
    const response = await fetch(streamUrl, {
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
          stability: isPartOfSequence ? 0.38 : 0.35,    // Slightly more stable for sequence chunks
          similarity_boost: 0.68,                       // Reduced to minimize over-articulation
          style: 0.12,                                  // Slightly reduced for more natural delivery
          use_speaker_boost: true,
          speaking_rate: speechRate,                    // Adjusted based on position in sequence
          pause_frequency: isFirstChunk ? 0.2 : 0.1,    // Lower pause frequency for continuing chunks
          clarity: 0.85,                                // High clarity setting to reduce mumbling
          pause_length: isPartOfSequence ? 0.2 : 0.4,   // Shorter pauses between chunks in a sequence
          pronunciation_clarity: 0.9                    // Higher pronunciation clarity
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error (${response.status}): ${errorText}`);
      return res.status(response.status).json({ 
        error: `ElevenLabs API error: ${response.statusText}`,
        details: errorText
      });
    }

    // Process the streaming response
    const audioArrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioArrayBuffer).toString('base64');
    
    console.log(`Successfully generated speech via streaming API (${audioArrayBuffer.byteLength} bytes)`);
    return res.status(200).json({ audio: base64Audio });
    
  } catch (error) {
    console.error('Error in text-to-speech processing:', error);
    return res.status(500).json({ 
      error: 'Failed to process text-to-speech request',
      details: error.message 
    });
  }
}
