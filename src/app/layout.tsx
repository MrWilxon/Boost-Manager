import React from 'react';
import Providers from './providers';
import '../index.css';

export const metadata = {
  title: 'Boost Manager - Online Boosting Services',
  description: 'Manage and request social media boosting requests easily.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
