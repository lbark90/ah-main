
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const recordingId = url.pathname.split('/').pop();
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }

    const recordingsDir = path.join(process.cwd(), 'storage', 'recordings');
    const filePath = path.join(recordingsDir, recordingId);
    
    const file = await fs.readFile(filePath);
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': file.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving recording:', error);
    return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as Blob;
    const userId = formData.get('userId') as string;
    const questionId = formData.get('questionId') as string;
    
    if (!file || !userId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${userId}_question${questionId}_${timestamp}.webm`;
    
    const recordingsDir = path.join(process.cwd(), 'storage', 'recordings');
    await fs.mkdir(recordingsDir, { recursive: true });
    
    const filePath = path.join(recordingsDir, filename);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error('Error saving recording:', error);
    return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 });
  }
}
