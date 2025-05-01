
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
}
