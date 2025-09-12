import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Sparkles, FileText, Home, User, CreditCard, LogOut, ChevronDown, Crown, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [entitlement, setEntitlement] = useState(null);

  // Fetch user entitlement data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/entitlements');
          if (response.ok) {
            const data = await response.json();
            setEntitlement(data);
            setUserPlan(data.plan || 'free');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [session]);

  const getPlanDisplayName = (plan, entitlement) => {
    switch (plan) {
      case 'free': return 'Free Plan';
      case 'day_pass': {
        if (entitlement?.expiresAt) {
          const expiresAt = new Date(entitlement.expiresAt);
          const now = new Date();
          const hoursLeft = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60)));
          return `Day Pass (${hoursLeft}h left)`;
        }
        return 'Day Pass';
      }
      case 'pro_monthly': return 'Pro Monthly';
      case 'pro_annual': return 'Pro Annual';
      default: return 'Free Plan';
    }
  };

  const getPlanIcon = (plan) => {
    if (plan === 'free') return <User className="w-4 h-4" />;
    return <Crown className="w-4 h-4" />;
  };

  const handleBillingClick = async () => {
    if (userPlan === 'free') {
      // Redirect to pricing page for upgrades
      router.push('/pricing');
    } else {
      // Open Stripe customer portal
      try {
        const response = await fetch('/api/stripe/portal', { method: 'POST' });
        if (response.ok) {
          const { url } = await response.json();
          window.open(url, '_blank');
        }
      } catch (error) {
        console.error('Error opening billing portal:', error);
      }
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your current billing period.'
    );
    
    if (confirmed) {
      try {
        // Open Stripe portal directly to the cancellation page
        const response = await fetch('/api/stripe/portal', { method: 'POST' });
        if (response.ok) {
          const { url } = await response.json();
          // Open the portal which will allow them to cancel
          window.open(url, '_blank');
        }
      } catch (error) {
        console.error('Error opening cancellation portal:', error);
        alert('Unable to process cancellation. Please contact support.');
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-200"></div>
              </div>
              <span className="text-xl font-bold text-gradient">TailoredCV.app</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`nav-link ${router.pathname === '/' ? 'active' : ''}`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link 
              href="/wizard" 
              className={`nav-link ${router.pathname === '/wizard' ? 'active' : ''}`}
            >
              <FileText className="w-4 h-4" />
              Create Resume
            </Link>
            {router.pathname === '/results' && (
              <Link 
                href="/results" 
                className="nav-link active"
              >
                <Sparkles className="w-4 h-4" />
                Results
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 bg-white/60 hover:bg-white/80 px-3 py-2 rounded-lg border border-gray-200/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    {getPlanIcon(userPlan)}
                    <span className="truncate max-w-[150px]">{session.user.email}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPlanIcon(userPlan)}
                          <span className="font-medium text-gray-900">{getPlanDisplayName(userPlan, entitlement)}</span>
                          {userPlan !== 'free' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{session.user.email}</p>
                        {userPlan === 'free' && entitlement && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">{entitlement.freeWeeklyCreditsRemaining || 0}/15</span> credits remaining
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={handleBillingClick}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{userPlan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}</span>
                        </button>
                        
                        {/* Cancel Subscription - only show for paid plans */}
                        {userPlan !== 'free' && (
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleCancelSubscription();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Subscription</span>
                          </button>
                        )}
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
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
                  className="btn btn-ghost btn-sm"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn btn-secondary btn-sm"
                >
                  Sign Up
                </Link>
                <Link 
                  href="/wizard" 
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn btn-ghost btn-sm"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
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
            <div className="absolute top-full left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg">
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
                <Link 
                  href="/wizard" 
                  className={`mobile-nav-link ${router.pathname === '/wizard' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText className="w-4 h-4" />
                  Create Resume
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
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {status === 'loading' ? (
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  ) : session ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                        {getPlanIcon(userPlan)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getPlanDisplayName(userPlan, entitlement)}</p>
                          <p className="text-sm text-gray-600 truncate">{session.user.email}</p>
                          {userPlan === 'free' && entitlement && (
                            <p className="text-xs text-gray-500">
                              {entitlement.freeWeeklyCreditsRemaining || 0}/15 credits remaining
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
                          className="w-full flex items-center space-x-2 text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{userPlan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}</span>
                        </button>
                        
                        {userPlan !== 'free' && (
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              handleCancelSubscription();
                            }}
                            className="w-full flex items-center space-x-2 text-left px-4 py-3 text-sm text-orange-700 hover:bg-orange-50 rounded-lg border border-orange-200"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Subscription</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            signOut();
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
                        className="w-full btn btn-secondary btn-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                      <Link 
                        href="/wizard" 
                        className="w-full btn btn-primary btn-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Sparkles className="w-4 h-4" />
                        Get Started
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