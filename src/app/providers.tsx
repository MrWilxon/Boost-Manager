'use client';

import React from 'react';
import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { OneSignalProvider } from '@/src/context/OneSignalProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OneSignalProvider>
          {children}
        </OneSignalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
