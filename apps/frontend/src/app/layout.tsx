import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'MediaFlow - Distributed Cloud Media Processing Platform',
  description: 'High-performance cloud image transformation and video transcoding platform powered by BullMQ & microservices.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
