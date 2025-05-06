import { AppProps } from 'next/app';
import ChunkErrorBoundary from '../components/ChunkErrorBoundary';
import 'app/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChunkErrorBoundary>
      <Component {...pageProps} />
    </ChunkErrorBoundary>
  );
}

export default MyApp;
