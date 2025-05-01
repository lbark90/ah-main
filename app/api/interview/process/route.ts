import { NextResponse } from 'next/server';
import path from 'path';
//fs is no longer needed because we assume recordings are already available.
//import fs from 'fs/promises';

export async function POST(request: Request) {
  try {
    const { recordings, userId, voiceId } = await request.json();

    const transcripts = [];

    const { spawn } = require('child_process');
    
    // Process each recording for transcription
    for (const recording of recordings) {
      try {
        // Call Python transcription service
        const process = spawn('python', [
          'lib/audio/transcription_service.py',
          recording.audioUrl,
          userId
        ]);
        
        const transcript = await new Promise((resolve, reject) => {
          let output = '';
          process.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          process.on('close', (code) => {
            if (code === 0) {
              resolve(output.trim());
            } else {
              reject(new Error(`Transcription failed with code ${code}`));
            }
          });
        });
        
        transcripts.push({
          questionIndex: recording.questionIndex,
          transcript
        });
      } catch (error) {
        console.error('Error transcribing audio:', error);
      }
    }

    return NextResponse.json({ success: true, transcripts });
  } catch (error) {
    console.error('Error processing interview:', error);
    return NextResponse.json({ error: 'Failed to process interview' }, { status: 500 });
  }
}