'use client';

import { useEffect } from 'react';

export function ErrorOverlayKiller() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      // Find the Next.js error portal
      const portals = document.querySelectorAll('nextjs-portal');
      
      portals.forEach(portal => {
        const shadowRoot = portal.shadowRoot;
        if (shadowRoot) {
          const textContent = shadowRoot.textContent || '';
          
          // Check if it's the specific hydration error caused by the browser extension
          // OR an annoying AuthApiError regarding Invalid Refresh Token
          if (
            (textContent.includes('A tree hydrated but some attributes') && 
            (textContent.includes('bis_skin_checked') || textContent.includes('cz-shortcut-listen'))) ||
            textContent.includes('Invalid Refresh Token') ||
            textContent.includes('AuthApiError: Invalid Refresh Token')
          ) {
            // Nuke the error overlay from orbit
            portal.remove();
            console.log('🛡️ Auto-dismissed specific error overlay.');
          }
        }
      });
    }, 100); // Check frequently

    // Also suppress console.error for this specific Supabase warning so it doesn't clutter DevTools
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
      
      const isHydrationError = args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('A tree hydrated but some attributes') ||
          arg.includes('Warning: Prop `') ||
          arg.includes('bis_skin_checked') ||
          arg.includes('cz-shortcut-listen')
        )
      );

      if (
        isHydrationError ||
        (msg && msg.includes('Invalid Refresh Token')) ||
        (msg && msg.includes('safeframe.googlesyndication.com')) ||
        (msg && msg.includes('chrome-error://chromewebdata/'))
      ) {
        return; // Ignore
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      clearInterval(interval);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
