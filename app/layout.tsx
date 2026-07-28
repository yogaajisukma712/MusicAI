import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MusicAI - YouTube Music Player',
  description: 'Search and play YouTube music',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
