import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;
    const questionIndex = formData.get('questionIndex') as string;
    const userId = formData.get('userId') as string;

    if (!audio || !questionIndex || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get transcription
    const transcription = await transcribeAudio(audio, parseInt(questionIndex), userId);

    if (!transcription) {
      throw new Error('No transcription returned');
    }

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
async function transcribeAudio(audio: Blob, questionIndex: number, userId: string): Promise<string> {
  try {
    // Create unique filename for the audio
    const audioBytes = await audio.arrayBuffer();
    const buffer = Buffer.from(audioBytes);
    const filename = `${userId}_q${questionIndex}_${Date.now()}.wav`;
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filepath = path.join(uploadDir, filename);
    
    // Save audio file temporarily
    await writeFile(filepath, buffer);
    
    // In a real implementation, you would call a speech-to-text API here
    // For example, using OpenAI Whisper, Google Speech-to-Text, etc.
    
    // Mock implementation - replace with actual API call
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: 'audio/wav' }), filename);
        formData.append('model', 'whisper-1');
        return formData;
      })()
    });
    
    if (!response.ok) {
      throw new Error(`Transcription API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}
}
