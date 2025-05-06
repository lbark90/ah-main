'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo);

    // Attempt to reload the missing chunk
    if (error.message && error.message.includes('Loading chunk')) {
      console.log('Chunk loading error detected, refreshing the page...');
      // Wait a moment before refreshing to avoid immediate reload loops
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
          <h2 className="text-red-600 text-lg font-medium mb-2">Something went wrong loading the application</h2>
          <p className="text-red-500 mb-4">The application is recovering...</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Reload Now
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
