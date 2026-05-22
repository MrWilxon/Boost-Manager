import React from 'react';
import Providers from './providers';
import '../index.css';

import { ErrorOverlayKiller } from '@/src/components/ErrorOverlayKiller';
import { WhatsAppSupportButton } from '@/src/components/common/WhatsAppSupportButton';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
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
