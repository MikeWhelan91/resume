import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Sparkles, FileText, Home, User, CreditCard, LogOut, ChevronDown, Crown, Settings, Globe, Lock, LayoutDashboard, Monitor, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useError } from '../../contexts/ErrorContext';
import { useCreditContext } from '../../contexts/CreditContext';
import ThemeToggle from './ThemeToggle';
import LanguagePicker from './LanguagePicker';

export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTerminology, toggleLanguage, getLanguageDisplay } = useLanguage();
  const { showError } = useError();
  const {
    creditStatus,
    entitlement,
    userPlan,
    dayPassUsage,
    downloadUsage,
    subscriptionInfo,
    loading: creditLoading
  } = useCreditContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authCheck, setAuthCheck] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const terms = getTerminology();


  // Check auth status for access control
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth-check');
        const data = await response.json();
        setAuthCheck(data);
      } catch (error) {
        console.error('Error checking auth status:', error);
        // If check fails, assume no access for safety
        setAuthCheck({ authenticated: false, canAccess: false, reason: 'Unable to verify access' });
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [session]);

  const getPlanDisplayName = (plan, entitlement) => {
    switch (plan) {
      case 'free':
      case 'standard':
        return 'Standard User';
      
      case 'pro_monthly': return 'Pro Monthly';
      case 'pro_annual': return 'Pro Annual';
      default: return 'Standard User';
    }
  };

  const getPlanIcon = (plan) => {
    if (plan === 'free' || plan === 'standard') return <User className="w-4 h-4" />;
    return <Crown className="w-4 h-4" />;
  };

  const formatCancellationDate = (canceledAt) => {
    if (!canceledAt) return null;
    const date = new Date(canceledAt);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getDaysUntilNextMonth = () => {
    const now = new Date();
    const dublinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Dublin"}));

    // Get first day of next month
    const nextMonth = new Date(dublinTime.getFullYear(), dublinTime.getMonth() + 1, 1);

    // Calculate days difference
    const timeDiff = nextMonth.getTime() - dublinTime.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };

  const getNextResetText = () => {
    const days = getDaysUntilNextMonth();
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `${days} days`;
    if (days <= 14) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''}`;
    return `${Math.floor(days / 7)} weeks`;
  };

  const getCreditStatus = () => {
    if (String(userPlan || '').startsWith('pro')) {
      return {
        type: 'unlimited',
        display: 'Unlimited credits'
      };
    } else if (userPlan === 'standard' && entitlement) {
      const remaining = entitlement.freeCreditsThisMonth || 0;
      return {
        type: 'monthly',
        remaining: remaining,
        nextReset: getNextResetText(),
        display: `${remaining} free credits remaining`
      };
    }
    return null;
  };

  const handleBillingClick = async () => {
    if (userPlan === 'standard') {
      // Redirect to pricing page for upgrades
      router.push('/pricing');
    } else {
      // Open Stripe customer portal
      try {
        const response = await fetch('/api/stripe/portal', { method: 'POST' });
        if (response.ok) {
          const { url } = await response.json();
          window.open(url, '_blank');
        } else {
          const errorData = await response.json().catch(() => ({}));
          
          if (errorData.code === 'PORTAL_NOT_CONFIGURED') {
            showError(`${errorData.message}\n\nFor billing assistance, please contact: ${errorData.supportEmail || 'support@tailoredcv.app'}`);
          } else {
            showError(errorData.message || 'Unable to open billing portal. Please try again or contact support.');
          }
        }
      } catch (error) {
        console.error('Error opening billing portal:', error);
        showError('Unable to open billing portal. Please try again or contact support.');
      }
    }
  };

  const handleWizardClick = (e) => {
    if (authCheck && !authCheck.canAccess) {
      e.preventDefault();

      // Show a more detailed credit modal for authenticated users
      if (authCheck.authenticated) {
        // Check if it's a credit issue
        if (creditStatus && creditStatus.needsCredits) {
          showCreditModal();
        } else {
          showError(authCheck.reason || 'You do not have access to create new resumes. Please upgrade your plan.', 'Access Denied');
        }
      } else {
        showError(authCheck.reason || 'You have used all your free trials. Please sign up to create unlimited resumes!', 'Trial Limit Reached');
      }
      return;
    }
  };

  const showCreditModal = () => {
    const isUnlimited = creditStatus?.credits === 'unlimited';
    const creditsRemaining = creditStatus?.credits?.total || 0;

    if (isUnlimited) {
      // Should not happen, but fallback
      router.push('/pricing');
      return;
    }

    const modalContent = `
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Credits Remaining</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">You have ${creditsRemaining} credits left. You need credits to create tailored resumes and cover letters.</p>
        <div class="space-y-3">
          <button onclick="window.location.href='/pricing'" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Buy More Credits
          </button>
          <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
        ${modalContent}
      </div>
    `;

    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  };

  const getTooltipText = () => {
    if (!authCheck) return null;
    if (authCheck.canAccess) return null;
    
    if (authCheck.authenticated) {
      return authCheck.reason || 'Upgrade required to create resumes';
    } else {
      return authCheck.reason || 'Sign up to create resumes';
    }
  };

  const canAccessWizard = authCheck?.canAccess !== false;

  // Removed popup-based functions - now using dedicated pages

  return (
    <nav className="fixed md:static top-0 left-0 right-0 md:top-auto md:left-auto md:right-auto z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
      <div className="tc-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative mr-3">
                {/* Light mode: favicon1, Dark mode: sparkles icon */}
                <img
                  src="/favicon1.png"
                  alt="TailoredCV.app"
                  className="w-10 h-8 rounded-lg dark:hidden transform group-hover:scale-105 transition-all duration-300"
                />
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-xl hidden dark:flex">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/30 to-blue-700/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300 hidden dark:block"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 dark:text-white transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  TailoredCV
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1 opacity-75">
                  AI Resume Builder
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                router.pathname === '/'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                  router.pathname === '/dashboard'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}
            <div className="relative">
              <Link
                href={canAccessWizard ? "/wizard" : "#"}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                  router.pathname === '/wizard'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : canAccessWizard
                      ? 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                }`}
                onClick={handleWizardClick}
                title={getTooltipText()}
              >
                {!canAccessWizard && <Lock className="w-3 h-3" />}
                <FileText className="w-4 h-4" />
                <span>Create {terms.Resume}</span>
              </Link>
            </div>
            {router.pathname === '/results' && (
              <Link
                href="/results"
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Results</span>
              </Link>
            )}

            <Link
              href="/pricing"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                router.pathname === '/pricing'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Pricing</span>
            </Link>
            
          </div>

          {/* Compact Navigation for medium screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            <Link
              href={canAccessWizard ? "/wizard" : "#"}
              className={`nav-link ${router.pathname === '/wizard' ? 'active' : ''} ${
                !canAccessWizard ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleWizardClick}
              title={getTooltipText()}
            >
              {!canAccessWizard && <Lock className="w-3 h-3 mr-1" />}
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">Create {terms.Resume}</span>
              <span className="xl:hidden">Create</span>
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className={`nav-link ${router.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="sr-only">Dashboard</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button and credits */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Credit Balance Display for Mobile */}
            {(status !== 'unauthenticated') && (
              <div className="flex items-center space-x-1.5 px-2 py-1 transition-all duration-200">
                {(status === 'loading' || creditLoading) ? (
                  <>
                    <Coins className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <div className="w-10 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </>
                ) : creditStatus ? (
                  <Link href="/pricing" className="flex items-center space-x-0.5 cursor-pointer group">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {creditStatus.credits === 'unlimited' ? '∞' : `${creditStatus.credits?.total || 0}`}
                    </span>
                    <Coins className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">

            {/* Credit Balance Display */}
            {(status !== 'unauthenticated') && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 transition-all duration-200">
                {(status === 'loading' || creditLoading) ? (
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : creditStatus ? (
                  <Link href="/pricing" className="flex items-center space-x-2 cursor-pointer group">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {creditStatus.credits === 'unlimited' ? 'Unlimited' : `${creditStatus.credits?.total || 0}`}
                    </span>
                    <Coins className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                  </Link>
                ) : null}
              </div>
            )}

            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                    {session.user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                      {session.user.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {getPlanDisplayName(userPlan, entitlement)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 py-3 z-20 overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                            {session.user.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">{getPlanDisplayName(userPlan, entitlement)}</span>
                              {userPlan !== 'free' && entitlement?.status === 'active' && !subscriptionInfo?.canceledAt && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  Active
                                </span>
                              )}
                              {subscriptionInfo?.canceledAt && entitlement?.status === 'canceled' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                  Canceled
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{session.user.email}</p>
                          </div>
                        </div>
                        
                        {/* Cancellation Info */}
                        {subscriptionInfo?.canceledAt && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                              Canceled on {formatCancellationDate(subscriptionInfo.canceledAt)}
                            </p>
                          </div>
                        )}

                        {/* Credit Status */}
                        {(() => {
                          const creditInfo = getCreditStatus();
                          if (!creditInfo) return null;

                          return (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                                <Coins className="w-3 h-3" />
                                <span>Credit Status</span>
                              </div>

                              {creditInfo.type === 'unlimited' ? (
                                <div className="flex items-center justify-center py-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                      Unlimited credits
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">6 free credits in</span>
                                  <span className="font-medium text-blue-600 dark:text-blue-400">
                                    {creditInfo.nextReset}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Menu Items */}
                      <div className="px-2 py-2 space-y-1">
                        <button
                          onClick={handleBillingClick}
                          className="w-full text-left px-3 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-3 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium">{(userPlan === 'standard' || userPlan === 'free') ? 'Upgrade Plan' : 'Manage Billing'}</span>
                        </button>

                        {/* Account Settings */}
                        <Link
                          href="/account"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full text-left px-3 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-3 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="font-medium">Account Settings</span>
                        </Link>

                        {/* Language Picker in dropdown */}
                        <div className="px-3 py-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <LanguagePicker />
                          </div>
                        </div>

                        {/* Theme Toggle in dropdown */}
                        <div className="px-3 py-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="ml-auto">
                              <ThemeToggle />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut({ callbackUrl: '/', redirect: true });
                          }}
                          className="w-full text-left px-3 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-3 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors">
                            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="btn btn-ghost btn-sm focus-ring"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn btn-primary btn-sm focus-ring"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile menu panel */}
            <div className="absolute top-full left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-b-2xl mx-4 mt-2">
              <div className="px-4 py-6 space-y-4">
                {/* Navigation Links */}
                <Link
                  href="/"
                  className={`mobile-nav-link ${router.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                {session && (
                  <Link
                    href="/dashboard"
                    className={`mobile-nav-link ${router.pathname === '/dashboard' ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                <Link 
                  href={canAccessWizard ? "/wizard" : "#"}
                  className={`mobile-nav-link ${router.pathname === '/wizard' ? 'active' : ''} ${
                    !canAccessWizard ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => {
                    handleWizardClick(e);
                    if (canAccessWizard) setIsMobileMenuOpen(false);
                  }}
                  title={getTooltipText()}
                >
                  {!canAccessWizard && <Lock className="w-3 h-3 mr-1" />}
                  <FileText className="w-4 h-4" />
                  Create {terms.Resume}
                </Link>
                
                {router.pathname === '/results' && (
                  <Link 
                    href="/results" 
                    className="mobile-nav-link active"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    Results
                  </Link>
                )}

                {/* Auth Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  {status === 'loading' ? (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  ) : session ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 px-4 py-3 bg-surface rounded-lg">
                        {getPlanIcon(userPlan)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{getPlanDisplayName(userPlan, entitlement)}</p>
                          <p className="text-sm text-muted truncate">{session.user.email}</p>
                          {(userPlan === 'standard' || userPlan === 'free') && creditStatus && (
                            <p className="text-xs text-muted">
                              {typeof creditStatus.credits === 'string' ? 'Unlimited' : `${creditStatus.credits?.total || 0} credits`}
                            </p>
                          )}
                        </div>
                        {userPlan !== 'free' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleBillingClick();
                          }}
                          className="w-full flex items-center space-x-2 text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{(userPlan === 'standard' || userPlan === 'free') ? 'Upgrade Plan' : 'Manage Billing'}</span>
                        </button>
                        
                        <Link
                          href="/account"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center space-x-2 text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </Link>
                        
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            signOut({ callbackUrl: '/', redirect: true });
                          }}
                          className="w-full flex items-center space-x-2 text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 rounded-lg border border-red-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/auth/signin"
                        className="w-full btn btn-ghost btn-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="w-full btn btn-primary btn-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

