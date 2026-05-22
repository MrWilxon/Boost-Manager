'use client';

import React, { useState, useEffect } from 'react';
import { CallBackProps, STATUS, Step } from 'react-joyride';
import dynamic from 'next/dynamic';

const Joyride = dynamic(() => import('react-joyride').then((mod: any) => mod.Joyride), { ssr: false });

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run the tour if it hasn't been completed before
    const hasCompletedTour = localStorage.getItem('boostManagerTourCompleted');
    if (!hasCompletedTour) {
      // Small delay to let the UI render completely
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left font-sans">
          <h2 className="text-xl font-black mb-2 text-[#1A1C1E]">Welcome to Boost Manager! 🚀</h2>
          <p className="text-sm text-gray-600 font-medium">
            Let's take a quick tour to get you started with managing your social media campaigns.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '.tour-step-balance',
      content: (
        <div className="text-left font-sans">
          <h3 className="text-lg font-black text-[#1A1C1E] mb-1">1. Add Balance</h3>
          <p className="text-sm text-gray-600 font-medium">
            Before creating a campaign, you'll need to load your wallet. Click here to submit a top-up request to the Admin.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-step-campaign',
      content: (
        <div className="text-left font-sans">
          <h3 className="text-lg font-black text-[#1A1C1E] mb-1">2. Create Campaign</h3>
          <p className="text-sm text-gray-600 font-medium">
            Once you have enough balance, click here to request a new social media boost (like Instagram Followers or YouTube Views).
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-step-settings',
      content: (
        <div className="text-left font-sans">
          <h3 className="text-lg font-black text-[#1A1C1E] mb-1">3. Profile Settings</h3>
          <p className="text-sm text-gray-600 font-medium">
            Update your WhatsApp number, agency name, avatar, or password anytime by clicking this settings icon.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-step-wallet',
      content: (
        <div className="text-left font-sans">
          <h3 className="text-lg font-black text-[#1A1C1E] mb-1">4. Your Wallet</h3>
          <p className="text-sm text-gray-600 font-medium">
            Keep an eye on your available balance here. It updates automatically when Admins approve your top-ups.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left font-sans">
          <h2 className="text-xl font-black mb-2 text-[#1A1C1E]">You're all set! 🎉</h2>
          <p className="text-sm text-gray-600 font-medium">
            Enjoy using Boost Manager. If you need help, feel free to contact support.
          </p>
        </div>
      ),
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('boostManagerTourCompleted', 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 1000,
          primaryColor: '#6366f1', // Indigo-500
          backgroundColor: '#ffffff',
          textColor: '#1A1C1E',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 'bold',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '10px',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
        buttonSkip: {
          color: '#ef4444',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
        tooltip: {
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        tooltipContainer: {
          textAlign: 'left',
        }
      }}
    />
  );
};
