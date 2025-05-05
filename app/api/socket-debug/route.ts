import { NextResponse } from 'next/server';

// This endpoint will let us debug the socket connection from the client
export async function POST(request: Request) {
  try {
    const data = await request.json();

    console.log('[Socket Debug]', data);

    // Try to make a WebSocket test connection if enabled
    if (data.testSocket) {
      try {
        const WebSocket = require('ws');
        const socket = new WebSocket(`ws://localhost:8080/ws`);

        let timeoutId: NodeJS.Timeout | undefined;

        const connectionPromise = new Promise((resolve, reject) => {
          socket.on('open', () => {
            console.log('Debug socket connection opened');

            // Send a test message
            socket.send(JSON.stringify({
              type: 'connection_init',
              user_id: data.userId,
              voice_id: data.voiceId,
              firstName: data.firstName,
              lastName: data.lastName,
              text: 'debug_test'
            }));

            setTimeout(() => {
              socket.close();
              resolve({ success: true, message: 'Socket connection test successful' });
            }, 1000);
          });

          socket.on('error', (err) => {
            console.error('Debug socket error:', err);
            reject({ success: false, message: 'Socket connection error', error: err.message });
          });

          // Set timeout for connection
          timeoutId = setTimeout(() => {
            reject({ success: false, message: 'Socket connection timeout' });
          }, 5000);
        });

        try {
          const result = await connectionPromise;
          clearTimeout(timeoutId);
          return NextResponse.json(result);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (socketError) {
        console.error('Socket test error:', socketError);
        return NextResponse.json({
          success: false,
          message: 'Socket test failed',
          error: socketError instanceof Error ? socketError.message : String(socketError)
        });
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Socket debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
