import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { userId, firstName, lastName } = await req.json();
    
    if (!userId || !firstName || !lastName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const result = await new Promise<{ success: boolean; voiceId?: string; error?: string; code?: number }>((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      const pythonProcess = spawn('python3', [
        path.join(process.cwd(), 'lib/audio/create_voice.py'),
        userId,
        `${firstName} ${lastName}`
      ]);

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`Voice creation error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        const finalCode = code !== null ? code : undefined;
        if (code === 0 && output.trim()) {
          resolve({ success: true, voiceId: output.trim() });
        } else {
          resolve({ success: false, error: errorOutput || 'Failed to create voice', code: finalCode });
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    if (result.success) {
      return NextResponse.json({ success: true, voiceId: result.voiceId });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in voice creation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
