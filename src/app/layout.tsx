import React from 'react';
import Providers from './providers';
import '../index.css';

import { ErrorOverlayKiller } from '@/src/components/ErrorOverlayKiller';
import { WhatsAppSupportButton } from '@/src/components/common/WhatsAppSupportButton';

import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Boost Manager - Command Center',
  description: 'Professional dashboard to manage and request social media boosting services.',
  keywords: ['Social Media', 'Boosting', 'Management', 'Dashboard', 'Marketing'],
  openGraph: {
    title: 'Boost Manager - Command Center',
    description: 'Professional dashboard to manage and request social media boosting services.',
    type: 'website',
    siteName: 'Boost Manager',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const msg = args.join(' ');
                if (
                  msg.includes('A tree hydrated but some attributes') ||
                  msg.includes('bis_skin_checked') ||
                  msg.includes('cz-shortcut-listen') ||
                  msg.includes('Warning: Prop \`')
                ) {
                  return;
                }
                originalConsoleError.apply(console, args);
              };
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        <ErrorOverlayKiller />
        <Providers>
          <WhatsAppSupportButton />
          {children}
        </Providers>
      </body>
    </html>
  );
}
