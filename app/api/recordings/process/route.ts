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

    // Await the Python script result
    const result = await new Promise((resolve, reject) => {
      let output = '';
      const pythonProcess = spawn('python3', [
        'lib/audio/process_recordings.py',
        userId,
        elevenlabsKey
      ]);

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (err) {
            reject(new Error('Failed to parse Python script output'));
          }
        } else {
          reject(new Error('Python script failed with non-zero exit code'));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error processing recordings:', error);
    return NextResponse.json(
      { error: 'Failed to process recordings', details: error.message },
      { status: 500 }
    );
  }
}
