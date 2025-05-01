
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { transcription, totalDuration } = await request.json();
    
    // Store transcription in a JSON file alongside recordings
    const transcriptionData = {
      text: transcription,
      totalDuration,
      timestamp: new Date().toISOString()
    };

    const filePath = path.join(process.cwd(), 'storage', 'recordings', 'transcription.json');
    await writeFile(filePath, JSON.stringify(transcriptionData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage error:', error);
    return NextResponse.json({ error: 'Failed to save transcription' }, { status: 500 });
  }
}
