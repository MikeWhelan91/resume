import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const CreditContext = createContext();

export const useCreditContext = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCreditContext must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [creditStatus, setCreditStatus] = useState(null);
  const [entitlement, setEntitlement] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [dayPassUsage, setDayPassUsage] = useState(null);
  const [downloadUsage, setDownloadUsage] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Hydrate from localStorage for instant UI (avoid blink on refresh)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('tcv_credit_cache') : null;
      if (raw) {
        const cached = JSON.parse(raw);
        // Accept cache if not older than 5 minutes
        if (cached && cached.timestamp && Date.now() - cached.timestamp < 5 * 60 * 1000) {
          if (cached.creditStatus) setCreditStatus(cached.creditStatus);
          if (cached.entitlement) setEntitlement(cached.entitlement);
          if (cached.userPlan) setUserPlan(cached.userPlan);
          if (cached.dayPassUsage) setDayPassUsage(cached.dayPassUsage);
          if (cached.downloadUsage) setDownloadUsage(cached.downloadUsage);
          if (cached.subscriptionInfo) setSubscriptionInfo(cached.subscriptionInfo);
          setLastUpdated(cached.timestamp);
          // Keep loading true while auth status is loading; otherwise show cached immediately
          if (status !== 'loading') setLoading(false);
        }
      }
    } catch (_) {
      // ignore cache errors
    }
  }, [status]);

  // Fetch all user data with optimistic loading
  const fetchUserData = useCallback(async (force = false) => {
    // Don't fetch again if we recently fetched and it's not forced
    if (!force && lastUpdated && Date.now() - lastUpdated < 30000) {
      return;
    }

    try {
      // Only show loading for initial fetch or forced refresh
      if (!lastUpdated || force) {
        setLoading(true);
      }

      // Fetch core data first (credits and entitlements), then background data
      const [entitlementResponse, creditResponse] = await Promise.all([
        fetch('/api/entitlements'),
        fetch('/api/credits/balance')
      ]);

      // Process critical data immediately
      let newEntitlement = null;
      let newUserPlan = userPlan;
      if (entitlementResponse.ok) {
        const data = await entitlementResponse.json();
        newEntitlement = data;
        setEntitlement(data);
        let effectivePlan = (data.plan === 'free' ? 'standard' : (data.plan || 'standard'));
        
        newUserPlan = effectivePlan;
        setUserPlan(effectivePlan);
      }

      let newCreditStatus = null;
      if (creditResponse.ok) {
        const creditData = await creditResponse.json();
        newCreditStatus = creditData;
        setCreditStatus(creditData);
      }

      // Fetch secondary data in background
      const [downloadResponse, subscriptionResponse] = await Promise.all([fetch('/api/download-usage'), fetch('/api/stripe/subscription-info')]);

      let newDayPass = null;
      

      let newDownloads = null;
      if (downloadResponse.ok) {
        const downloadData = await downloadResponse.json();
        newDownloads = downloadData;
        setDownloadUsage(downloadData);
      }

      let newSubscription = null;
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        newSubscription = subscriptionData;
        setSubscriptionInfo(subscriptionData);
      }

      const ts = Date.now();
      setLastUpdated(ts);

      // Persist a compact cache for quick rehydration
      try {
        localStorage.setItem('tcv_credit_cache', JSON.stringify({
          timestamp: ts,
          creditStatus: newCreditStatus ?? creditStatus,
          entitlement: newEntitlement ?? entitlement,
          userPlan: newUserPlan ?? userPlan,
          dayPassUsage: newDayPass ?? dayPassUsage,
          downloadUsage: newDownloads ?? downloadUsage,
          subscriptionInfo: newSubscription ?? subscriptionInfo,
        }));
      } catch (_) {}
    } catch (error) {
      // Ignore 401s (unauthenticated) and network errors
      // console.error('Error fetching user data:', error);
    } finally {
      // If user is authenticated or unauthenticated, stop loading; if status still loading, keep skeleton
      if (status !== 'loading') setLoading(false);
    }
  }, [lastUpdated, status, creditStatus, entitlement, userPlan, dayPassUsage, downloadUsage, subscriptionInfo]);

  // Force refresh credit data (called after actions that modify credits)
  const refreshCredits = useCallback(() => {
    return fetchUserData(true);
  }, [fetchUserData]);

  // Update credits locally (optimistic updates)
  const updateCreditsLocally = useCallback((delta) => {
    setCreditStatus(prev => {
      if (!prev || prev.credits === 'unlimited') return prev;

      const newTotal = Math.max(0, prev.credits.total + delta);
      return {
        ...prev,
        credits: {
          ...prev.credits,
          total: newTotal
        }
      };
    });
  }, []);

  // Update downloads locally
  const updateDownloadsLocally = useCallback((type, delta = 1) => {
    setDownloadUsage(prev => {
      if (!prev) return prev;

      const field = type === 'pdf' ? 'pdfDownloads' : 'docxDownloads';
      return {
        ...prev,
        [field]: (prev[field] || 0) + delta
      };
    });
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();

      // Set up periodic refresh every 2 minutes when user is active
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchUserData();
        }
      }, 120000);

      return () => clearInterval(interval);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    } else {
      setLoading(true); // while session state loads, keep skeleton
    }
  }, [status]); // Removed fetchUserData dependency to prevent loops

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        fetchUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status]); // Removed fetchUserData dependency to prevent infinite loops

  const value = {
    creditStatus,
    entitlement,
    userPlan,
    dayPassUsage,
    downloadUsage,
    subscriptionInfo,
    loading,
    refreshCredits,
    updateCreditsLocally,
    updateDownloadsLocally,
    lastUpdated
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

