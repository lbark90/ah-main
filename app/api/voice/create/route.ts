
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

    const pythonProcess = spawn('python3', [
      path.join(process.cwd(), 'lib/audio/create_voice.py'),
      userId,
      `${firstName} ${lastName}`
    ]);

    return new Promise((resolve) => {
      let result = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`Voice creation error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && result.trim()) {
          resolve(NextResponse.json({ 
            success: true, 
            voiceId: result.trim() 
          }));
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            error: errorOutput || 'Failed to create voice',
            code 
          }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('Error in voice creation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
