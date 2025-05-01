
import { NextResponse } from 'next/server';
import { localStorageService } from '@/lib/storage/localStorageService';

export async function GET(request: Request) {
  try {
    const recordings = localStorageService.getSessionRecordings();
    return NextResponse.json({ recordings });
  } catch (error) {
    console.error('Failed to get recordings:', error);
    return NextResponse.json({ error: 'Failed to get recordings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;
    const sessionId = formData.get('sessionId') as string;
    const transcript = formData.get('transcript') as string;

    if (!audio || !sessionId) {
      return NextResponse.json(
        { error: 'Audio and session ID are required' },
        { status: 400 }
      );
    }

    const recordingId = `recording_${Date.now()}`;
    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    const recording = {
      id: recordingId,
      sessionId,
      audioUrl: `/api/recordings/${recordingId}/audio`,
      transcript,
      timestamp: new Date().toISOString(),
      audioData: audioBuffer,
    };
    
    await localStorageService.saveRecording(recording);
    return NextResponse.json({ success: true, recordingId });
  } catch (error: any) {
    console.error('Error saving recording:', error);
    return NextResponse.json(
      { error: 'Failed to save recording' },
      { status: 500 }
    );
  }
}
