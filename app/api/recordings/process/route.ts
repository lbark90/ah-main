
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Run the Python script
    const pythonProcess = spawn('python3', [
      'lib/audio/process_recordings.py',
      userId,
      elevenlabsKey
    ]);

    return new Promise((resolve) => {
      let result = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ success: true, result: JSON.parse(result) }));
        } else {
          resolve(NextResponse.json(
            { error: 'Failed to process recordings' },
            { status: 500 }
          ));
        }
      });
    });
  } catch (error) {
    console.error('Error processing recordings:', error);
    return NextResponse.json(
      { error: 'Failed to process recordings' },
      { status: 500 }
    );
  }
}
