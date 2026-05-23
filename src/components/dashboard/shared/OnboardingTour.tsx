'use client';

import React, { useState, useEffect } from 'react';
import { STATUS, Step } from 'react-joyride';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../context/AuthContext';

const Joyride = dynamic(() => import('react-joyride').then((mod: any) => mod.default || mod.Joyride || mod), { ssr: false }) as any;

// ── helpers ────────────────────────────────────────────────────────────────────
/** Returns true when ALL of the given CSS selectors exist in the DOM */
const allTargetsExist = (selectors: string[]) =>
  selectors.every((s) => {
    if (s === 'body') return true;
    const el = document.querySelector(s);
    if (!el) return false;
    // Element must also be visible (not hidden by CSS like "hidden md:flex")
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });

const TOUR_KEY = 'boostManagerTourCompleted';

// ── component ──────────────────────────────────────────────────────────────────
export const OnboardingTour = () => {
  const { profile } = useAuth();
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait until component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Start tour only when:
  //  1. Not completed before for this user
  //  2. Profile has loaded (so wallet balance renders)
  //  3. Required DOM targets are visible
  useEffect(() => {
    if (!mounted) return;
    if (!profile) return; // wait for auth
    
    const userTourKey = `${TOUR_KEY}_${profile.id || profile.uid}`;
    if (localStorage.getItem(userTourKey)) return;

    // Poll for required elements (they render after data loads)
    const requiredSelectors = [
      '.tour-step-balance',
      '.tour-step-campaign',
    ];

    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 10 seconds max

    const check = () => {
      attempts++;
      if (allTargetsExist(requiredSelectors)) {
        // Extra 400 ms grace period so animations settle
        setTimeout(() => {
          setRun(true);
          // Mark as seen immediately so it doesn't show again on refresh
          localStorage.setItem(userTourKey, 'true');
        }, 400);
      } else if (attempts < MAX_ATTEMPTS) {
        setTimeout(check, 500);
      } else {
        // Exhausted attempts - mark seen anyway so we don't loop forever next time
        localStorage.setItem(userTourKey, 'true');
      }
    };

    check();
  }, [mounted, profile]);

  // ── Build steps dynamically (omit steps whose target is missing/hidden) ────
  const isMobile = mounted && window.innerWidth < 768;

  const allSteps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left font-sans">
          <h2 className="text-xl font-black mb-2 text-[#1A1C1E]">Welcome to Boost Manager! 🚀</h2>
          <p className="text-sm text-gray-600 font-medium">
            Let&apos;s take a quick tour to get you started with managing your social media campaigns.
          </p>
        </div>
      ),
    },
    {
      target: '.tour-step-balance',
      placement: 'bottom',

      content: (
        <div className="text-left font-sans">
          <h3 className="text-lg font-black text-[#1A1C1E] mb-1">1. Add Balance</h3>
          <p className="text-sm text-gray-600 font-medium">
            Before creating a campaign, load your wallet. Click here to submit a top-up request to the Admin.
          </p>
        </div>
      ),
    },
    {
      target: '.tour-step-campaign',
      placement: 'bottom',

      content: (
        <div className="text-left font-sans">
          <h3 className="text-lg font-black text-[#1A1C1E] mb-1">2. Create Campaign</h3>
          <p className="text-sm text-gray-600 font-medium">
            Once you have enough balance, click here to request a new social media boost (Instagram Followers, YouTube Views, etc.).
          </p>
        </div>
      ),
    },
    // Settings step — only shown on desktop where the icon is visible
    ...(!isMobile
      ? [
          {
            target: '.tour-step-settings',
            placement: 'bottom' as const,
      
            content: (
              <div className="text-left font-sans">
                <h3 className="text-lg font-black text-[#1A1C1E] mb-1">3. Profile Settings</h3>
                <p className="text-sm text-gray-600 font-medium">
                  Update your WhatsApp number, agency name, avatar, or password anytime by clicking this icon.
                </p>
              </div>
            ),
          },
        ]
      : []),
    // Wallet step — only shown when wallet element is visible
    ...(!isMobile
      ? [
          {
            target: '.tour-step-wallet',
            placement: 'bottom' as const,
      
            content: (
              <div className="text-left font-sans">
                <h3 className="text-lg font-black text-[#1A1C1E] mb-1">{isMobile ? '3' : '4'}. Your Wallet</h3>
                <p className="text-sm text-gray-600 font-medium">
                  Keep an eye on your available balance here. It updates automatically when Admins approve your top-ups.
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left font-sans">
          <h2 className="text-xl font-black mb-2 text-[#1A1C1E]">You&apos;re all set! 🎉</h2>
          <p className="text-sm text-gray-600 font-medium">
            Enjoy using Boost Manager. If you need help, feel free to contact support.
          </p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;

    // Tour completed or skipped → mark as done
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      if (profile) {
        localStorage.setItem(`${TOUR_KEY}_${profile.id || profile.uid}`, 'true');
      }
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      steps={allSteps}
      scrollToFirstStep
      showProgress
      showSkipButton
      hideCloseButton={false}
      disableOverlayClose
      spotlightClicks={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#6366f1',
          backgroundColor: '#ffffff',
          textColor: '#1A1C1E',
          overlayColor: 'rgba(0, 0, 0, 0.65)',
          arrowColor: '#ffffff',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          padding: '8px 18px',
          fontWeight: '800',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          border: 'none',
          cursor: 'pointer',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '10px',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#ef4444',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        },
        tooltip: {
          padding: '24px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          fontFamily: 'inherit',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        spotlight: {
        },
      }}
    />
  );
};
