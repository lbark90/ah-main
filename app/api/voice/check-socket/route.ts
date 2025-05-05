import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  try {
    // Check if port 8080 is listening
    const portCheckPromise = new Promise<string>((resolve, reject) => {
      exec('ss -tuln | grep ":8080"', (error, stdout) => {
        if (error && error.code !== 1) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });

    // Check if the python socket server process is running
    const processCheckPromise = new Promise<string>((resolve, reject) => {
      exec('ps aux | grep "[p]ython.*socket_server\\.py"', (error, stdout) => {
        if (error && error.code !== 1) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });

    const [portCheck, processCheck] = await Promise.all([portCheckPromise, processCheckPromise]);

    const isPortOpen = portCheck.trim() !== '';
    const isProcessRunning = processCheck.trim() !== '';

    let status = {
      portStatus: isPortOpen ? "Port 8080 is open" : "Port 8080 is not open",
      processStatus: isProcessRunning ? "Socket server process is running" : "Socket server process is not running",
      message: "Unknown status"
    };

    if (isPortOpen && isProcessRunning) {
      status.message = "Socket server is running and port 8080 is open";
    } else if (!isProcessRunning) {
      status.message = "Socket server process is not running";
    } else if (!isPortOpen) {
      status.message = "Socket server port 8080 is not open";
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking socket server:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking socket server',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
