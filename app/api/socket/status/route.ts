import { NextResponse } from 'next/server';

// Add this export to force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check if WebSocket server is running by attempting a simple HTTP request to the WebSocket server
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.NODE_ENV === 'production' ? request.headers.get('host') : 'localhost:8080';

    const statusUrl = `${protocol}://${host}/status`;

    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        return NextResponse.json({
          status: 'running',
          message: 'WebSocket server is running'
        });
      } else {
        return NextResponse.json({
          status: 'error',
          message: `WebSocket server returned status ${response.status}`
        });
      }
    } catch (error) {
      console.error('Error checking WebSocket server status:', error);
      return NextResponse.json({
        status: 'not_running',
        message: 'WebSocket server is not running or not reachable'
      });
    }
  } catch (error) {
    console.error('Error in socket status route:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error checking WebSocket server status',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
