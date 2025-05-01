
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: Request, { params }: { params: { question: string } }) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const userName = searchParams.get('user') || '';
        const questionNum = params.question;

        const pythonProcess = spawn('python3', [
            'lib/audio/audio_retriever.py',
            userName,
            questionNum
        ]);

        return new Promise((resolve) => {
            const chunks: Buffer[] = [];
            
            pythonProcess.stdout.on('data', (data) => {
                chunks.push(Buffer.from(data));
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Python error: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                if (code === 0 && chunks.length > 0) {
                    const audioBuffer = Buffer.concat(chunks);
                    resolve(new NextResponse(audioBuffer, {
                        headers: {
                            'Content-Type': 'audio/mpeg',
                            'Content-Length': audioBuffer.length.toString()
                        }
                    }));
                } else {
                    resolve(NextResponse.json({ error: 'Audio file not found' }, { status: 404 }));
                }
            });
        });
    } catch (error) {
        console.error('Error fetching audio:', error);
        return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }
}
