import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Socket.io API route is ready' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mockTranscriptions = [
      "I remember when we used to go to the lake every summer.",
      "My grandmother taught me how to bake her famous apple pie.",
      "The most important lesson I learned was to always be kind.",
      "I hope my children remember how much I loved them.",
      "The proudest moment of my life was when my daughter graduated college.",
      "I want my family to know that I've lived a full and happy life.",
    ];

    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const mockTranscription = mockTranscriptions[randomIndex];

    return NextResponse.json({
      success: true,
      text: mockTranscription,
      sessionId: body.sessionId,
      questionId: body.questionId,
    });
  } catch (error) {
    console.error('Error processing audio data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process audio data' },
      { status: 500 }
    );
  }
}
