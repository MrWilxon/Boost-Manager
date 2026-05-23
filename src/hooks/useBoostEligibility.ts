import { useMemo } from 'react';
import { PromoCode, UserProfile } from '../types';

interface EligibilityParams {
  modalBudget: number;
  modalDuration: number;
  modalUrl: string;
  modalLocations: string[];
  modalAdGoal: string;
  selectedPlatforms: string[];
  isCustomAge: boolean;
  customAge: string;
  rate: number;
  platformRates?: Record<string, number>;
  appliedPromo: PromoCode | null;
  profile: UserProfile | null;
}

export const useBoostEligibility = (params: EligibilityParams) => {
  const {
    modalBudget,
    modalDuration,
    modalUrl,
    modalLocations,
    modalAdGoal,
    selectedPlatforms,
    isCustomAge,
    customAge,
    rate,
    platformRates,
    appliedPromo,
    profile
  } = params;

  return useMemo(() => {
    const currentRate = rate || 165;
    let baseRate = currentRate;
    
    let maxPlatformRate = currentRate;
    let rateConflict = false;
    if (platformRates && selectedPlatforms.length > 0) {
      const rates = selectedPlatforms.map(p => platformRates[p] || currentRate);
      maxPlatformRate = Math.max(...rates);
      const uniqueRates = new Set(rates);
      if (uniqueRates.size > 1) {
        rateConflict = true;
      }
      baseRate = maxPlatformRate;
    }

    let effectiveRate = baseRate;
    let discountPercent = 0;
    let fixedDiscount = 0;

    if (appliedPromo) {
      if (appliedPromo.discountType === "rate_override") {
        effectiveRate = appliedPromo.value;
      } else if (appliedPromo.discountType === "percentage") {
        discountPercent = appliedPromo.value;
      } else if (appliedPromo.discountType === "fixed") {
        fixedDiscount = appliedPromo.value;
      }
    }

    const totalBudget = modalBudget;
    const dailyBudget = modalDuration > 0 ? totalBudget / modalDuration : 0;

    const baseNpr = totalBudget * effectiveRate;
    const discountedNpr = baseNpr * (1 - discountPercent / 100) - fixedDiscount;
    const totalNpr = Math.max(0, Math.floor(discountedNpr));

    const balance = profile?.balance || 0;

    const warnings: { type: "error" | "warning" | "info"; message: string }[] = [];

    if (totalNpr > balance) {
      warnings.push({
        type: "error",
        message: `Insufficient balance. Cost: रू${totalNpr.toLocaleString()} | Balance: रू${balance.toLocaleString()}`,
      });
    }

    if (totalBudget <= 0) {
      warnings.push({ type: "error", message: "Budget must be greater than $0." });
    }

    if (dailyBudget < 2) {
      warnings.push({
        type: "error",
        message: `Min budget is $2/day. For ${modalDuration} days, total must be at least $${modalDuration * 2}.`,
      });
    }

    if (modalDuration < 1) {
      warnings.push({ type: "error", message: "Duration must be at least 1 day." });
    }

    if (!modalUrl.trim()) {
      warnings.push({ type: "error", message: "Campaign URL is required." });
    } else if (!modalUrl.startsWith("http")) {
      warnings.push({ type: "error", message: "Invalid URL format. Include http:// or https://" });
    }

    if (modalLocations.length === 0) {
      warnings.push({ type: "error", message: "Please select/specify at least one location." });
    }

    if (isCustomAge && !customAge.trim()) {
      warnings.push({ type: "error", message: "Please specify your custom age group." });
    }

    if (dailyBudget < 1) {
      warnings.push({
        type: "warning",
        message: `Extremely low daily budget ($${dailyBudget.toFixed(2)}). Results may be limited.`,
      });
    } else if (dailyBudget < 3) {
      warnings.push({
        type: "info",
        message: `Daily budget of $${dailyBudget} is okay, but $3-5 is recommended for better optimization.`,
      });
    }

    if (modalDuration < 4) {
      warnings.push({
        type: "warning",
        message: "Campaigns shorter than 4 days often don't have enough time to exit the 'Learning Phase'.",
      });
    }

    if (
      modalAdGoal === "Page Likes" &&
      selectedPlatforms.includes("Instagram") &&
      !selectedPlatforms.includes("Facebook")
    ) {
      warnings.push({
        type: "warning",
        message: "'Page Likes' is primarily a Facebook feature. Performance on Instagram for this goal may be poor.",
      });
    }

    if (rateConflict) {
      warnings.push({
        type: "info",
        message: `Multiple platforms selected with varying rates. The highest rate ($1 = रू${maxPlatformRate}) is applied.`,
      });
    }

    const estimatedReachMin = Math.floor(totalBudget * 500);
    const estimatedReachMax = Math.floor(totalBudget * 1200);
    const estimatedReach = `${estimatedReachMin.toLocaleString()} - ${estimatedReachMax.toLocaleString()} accounts`;

    return {
      isEligible: !warnings.some((w) => w.type === "error"),
      hasSeriousWarnings: warnings.some((w) => w.type === "error" || w.type === "warning"),
      warnings,
      totalNpr,
      effectiveRate,
      discountApplied: discountPercent > 0 || fixedDiscount > 0 || effectiveRate !== rate,
      estimatedReach,
    };
  }, [
    modalBudget,
    modalDuration,
    rate,
    platformRates,
    profile?.balance,
    modalUrl,
    modalAdGoal,
    selectedPlatforms,
    modalLocations,
    isCustomAge,
    customAge,
    appliedPromo,
  ]);
};
