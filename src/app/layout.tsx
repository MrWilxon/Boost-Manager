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
