'use client';

import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from './AuthContext';

let oneSignalInitPromise: Promise<void> | null = null;

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
        if (!oneSignalInitPromise) {
          oneSignalInitPromise = OneSignal.init({
            appId: appId,
            notifyButton: {
              enable: true,
            },
            allowLocalhostAsSecureOrigin: true, // For development
          });
        }
        
        await oneSignalInitPromise;

        try {
          if (user) {
            await OneSignal.login(user.id);
          } else {
            await OneSignal.logout();
          }
        } catch (loginError) {
          console.warn('OneSignal login/logout skipped:', loginError);
        }
      } catch (e) {
        console.warn('OneSignal Initialization failed', e);
      }
    };

    initOneSignal();
  }, [user]);

  return <>{children}</>;
};
