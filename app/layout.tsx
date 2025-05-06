import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import Header from './components/Header';
import ChunkErrorBoundary from '../components/ChunkErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ChunkErrorBoundary>
            <Header />
            {children}
          </ChunkErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}