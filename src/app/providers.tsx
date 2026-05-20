'use client';

import React from 'react';
import { AuthProvider } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
