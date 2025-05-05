import SocketTest from '../../components/SocketTest';

export default function SocketTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">WebSocket Connection Test</h1>
      <SocketTest />
    </div>
  );
}
