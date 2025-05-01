import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Socket.io API route is ready' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Mock transcription response
    const mockTranscriptions = [
      "I remember when we used to go to the lake every summer.",
      "My grandmother taught me how to bake her famous apple pie.",
      "The most important lesson I learned was to always be kind.",
      "I hope my children remember how much I loved them.",
      "The proudest moment of my life was when my daughter graduated college.",
      "I want my family to know that I've lived a full and happy life."
    ];
    
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const mockTranscription = mockTranscriptions[randomIndex];
    
    // Return mock response
    return NextResponse.json({ 
      success: true, 
      text: mockTranscription,
      sessionId: body.sessionId,
      questionId: body.questionId
    });
  } catch (error) {
    console.error('Error processing audio data:', error);
    return NextResponse.json({ success: false, error: 'Failed to process audio data' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;

    // For now using Whisper locally, but this could be replaced with other services
    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const tempPath = path.join(process.cwd(), 'storage', 'temp.webm');
    await writeFile(tempPath, audioBuffer);

    // TODO: Add actual transcription service integration
    // For now returning dummy transcription
    const transcription = "This is a placeholder transcription. Integrate with actual service.";

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
