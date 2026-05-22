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
          if (
            textContent.includes('A tree hydrated but some attributes') && 
            (textContent.includes('bis_skin_checked') || textContent.includes('cz-shortcut-listen'))
          ) {
            // Nuke the error overlay from orbit
            portal.remove();
            console.log('🛡️ Auto-dismissed browser extension hydration error overlay.');
          }
        }
      });
    }, 100); // Check frequently

    return () => clearInterval(interval);
  }, []);

  return null;
}
