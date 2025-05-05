export function initializeSocket(
  userId: string = '',
  voiceId: string = '',
  firstName: string = '',
  lastName: string = '',
  dob: string = '',
  profileDocument: string = ''
) {
  // Only check for userId as that's the most critical parameter
  if (!userId) {
    console.warn('Cannot initialize WebSocket: Missing userId');
    return null;
  }

  // Add some debug logging
  console.log(`Socket initialization with available data:`, {
    userId,
    voiceId: voiceId || '[will be fetched]',
    firstName: firstName || '[not provided]',
    lastName: lastName || '[not provided]',
    dob: dob || '[not provided]',
    profileDocument: profileDocument || '[not provided]'
  });

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const socketUrl = `${protocol}//${host}:8080`;

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => console.log("WebSocket connection established");
    socket.onerror = (event) => console.error("WebSocket error:", event);
    socket.onclose = (event) => console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    socket.onmessage = (event) => console.log("Message from server:", event.data);

    return socket;
  } catch (error) {
    console.error('Error during socket initialization:', error);
    return null;
  }
}
