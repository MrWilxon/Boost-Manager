'use client';

import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from './AuthContext';

let isOneSignalInitialized = false;

export const OneSignalProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  useEffect(() => {
    const initOneSignal = async () => {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      
      if (!appId) {
        console.warn('OneSignal App ID is not configured. Push notifications will be disabled.');
        return;
      }

      try {
        if (!isOneSignalInitialized) {
          isOneSignalInitialized = true; // Set synchronously to prevent React 18 Strict Mode double-calls
          await OneSignal.init({
            appId: appId,
            notifyButton: {
              enable: true,
            },
            allowLocalhostAsSecureOrigin: true, // For development
          });
        }

        try {
          if (user && isOneSignalInitialized) {
            await OneSignal.login(user.id);
          } else if (!user && isOneSignalInitialized) {
            await OneSignal.logout();
          }
        } catch (loginError) {
          console.warn('OneSignal login/logout skipped due to initialization failure.');
        }
      } catch (e) {
        console.warn('OneSignal Initialization failed', e);
      }
    };

    initOneSignal();
  }, [user]);

  return <>{children}</>;
};
