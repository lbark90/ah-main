import { promises as fs } from 'fs';

// Check if socket server is accessible
async function checkSocketServerAvailability() {
  try {
    // Check for lock file to see if server is running
    try {
      await fs.access('/tmp/socket_server.lock');
      return { available: true, message: "Socket server appears to be running" };
    } catch (err) {
      // Lock file doesn't exist
      return { available: false, message: "Socket server may not be running (lock file not found)" };
    }
  } catch (error) {
    console.error('Error checking socket server status:', error);
    return { available: false, message: `Error checking socket server: ${error.message}` };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing user ID'
      }), { status: 400 });
    }

    // Check if socket server is available
    const serverStatus = await checkSocketServerAvailability();

    return new Response(JSON.stringify({
      success: serverStatus.available,
      message: serverStatus.available ?
        'Ready to connect to WebSocket server' :
        'WebSocket server may not be running',
      serverStatus: serverStatus,
      connectionInfo: {
        protocol: 'wss:// or ws:// (depends on your site protocol)',
        host: 'your host',
        port: 8080,
        expectedUrl: '(protocol)://(host):8080'
      }
    }));

  } catch (error) {
    console.error('Error in start-socket:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error validating connection',
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
}