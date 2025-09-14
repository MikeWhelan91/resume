import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Sparkles, FileText, Home, User, CreditCard, LogOut, ChevronDown, Crown, Settings, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTerminology, toggleLanguage, getLanguageDisplay } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [entitlement, setEntitlement] = useState(null);
  const [dayPassUsage, setDayPassUsage] = useState(null);
  const [downloadUsage, setDownloadUsage] = useState(null);
  const terms = getTerminology();

  // Fetch user entitlement data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          // Fetch entitlement, usage, and day pass data in parallel
          const [entitlementResponse, dayPassResponse, downloadResponse] = await Promise.all([
            fetch('/api/entitlements'),
            fetch('/api/day-pass-usage'),
            fetch('/api/download-usage')
          ]);
          
          if (entitlementResponse.ok) {
            const data = await entitlementResponse.json();
            setEntitlement(data);
            // For UI purposes, we need to determine the effective plan
            // Day pass users should be treated as 'day_pass' for display
            let effectivePlan = data.plan || 'free';
            if (data.plan === 'day_pass' && data.expiresAt) {
              const isExpired = new Date() > new Date(data.expiresAt);
              effectivePlan = isExpired ? 'free' : 'day_pass';
            }
            setUserPlan(effectivePlan);
          }
          
          if (dayPassResponse.ok) {
            const dayPassData = await dayPassResponse.json();
            setDayPassUsage(dayPassData);
          }
          
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            setDownloadUsage(downloadData);
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

  const getUsageStats = () => {
    if (userPlan === 'free' && entitlement && downloadUsage) {
      return {
        generations: {
          used: 10 - (entitlement.freeWeeklyCreditsRemaining || 0),
          limit: 10,
          period: 'week'
        },
        downloads: {
          pdf: { used: downloadUsage.pdfDownloads || 0, limit: 10, period: 'week' },
          docx: { used: downloadUsage.docxDownloads || 0, limit: 0, period: 'week' }
        }
      };
    } else if (userPlan === 'day_pass' && dayPassUsage && downloadUsage) {
      return {
        generations: {
          used: dayPassUsage.generationsUsed || 0,
          limit: dayPassUsage.generationsLimit || 30,
          period: 'day'
        },
        downloads: {
          pdf: { used: downloadUsage.pdfDownloads || 0, limit: 100, period: 'day' },
          docx: { used: downloadUsage.docxDownloads || 0, limit: 100, period: 'day' }
        }
      };
    } else if (userPlan.startsWith('pro')) {
      return {
        generations: {
          used: 'Unlimited',
          limit: 'Unlimited',
          period: null
        },
        downloads: {
          pdf: { used: 'Unlimited', limit: 'Unlimited', period: null },
          docx: { used: 'Unlimited', limit: 'Unlimited', period: null }
        }
      };
    }
    return null;
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
        } else {
          const errorData = await response.json().catch(() => ({}));
          
          if (errorData.code === 'PORTAL_NOT_CONFIGURED') {
            alert(`${errorData.message}\n\nFor billing assistance, please contact: ${errorData.supportEmail || 'support@tailoredcv.app'}`);
          } else {
            alert(errorData.message || 'Unable to open billing portal. Please try again or contact support.');
          }
        }
      } catch (error) {
        console.error('Error opening billing portal:', error);
        alert('Unable to open billing portal. Please try again or contact support.');
      }
    }
  };

  // Removed popup-based functions - now using dedicated pages

  return (
    <nav className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border">
      <div className="tc-container">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-250">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-250"></div>
              </div>
              <span className="text-xl font-bold text-text group-hover:text-primary transition-colors duration-250">TailoredCV.app</span>
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
              Create {terms.Resume}
            </Link>
            {session && (
              <Link 
                href="/my-resumes" 
                className={`nav-link ${router.pathname === '/my-resumes' ? 'active' : ''}`}
              >
                <FileText className="w-4 h-4" />
                My {terms.ResumePlural}
              </Link>
            )}
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
                  className="flex items-center space-x-2 text-sm text-text hover:opacity-90 bg-surface/60 hover:bg-surface/80 px-3 py-2 rounded-lg border border-border/50 transition-all duration-200"
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
                    <div className="absolute right-0 mt-2 w-64 bg-surface rounded-lg shadow-xl border border-border py-2 z-20">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPlanIcon(userPlan)}
                          <span className="font-medium text-text">{getPlanDisplayName(userPlan, entitlement)}</span>
                          {userPlan !== 'free' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted truncate">{session.user.email}</p>
                        
                        {/* Usage Stats */}
                        {(() => {
                          const stats = getUsageStats();
                          if (!stats) return null;
                          
                          return (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-muted mb-1">Usage Overview</div>
                              
                              {/* Generations */}
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted">Generations</span>
                                <span className="font-medium">
                                  {typeof stats.generations.used === 'number' && typeof stats.generations.limit === 'number'
                                    ? `${stats.generations.used}/${stats.generations.limit}`
                                    : `${stats.generations.used}`}
                                  {stats.generations.period && ` per ${stats.generations.period}`}
                                </span>
                              </div>
                              
                              {/* Progress bar for finite limits */}
                              {typeof stats.generations.used === 'number' && typeof stats.generations.limit === 'number' && (
                                <div className="w-full bg-border/50 rounded-full h-1.5">
                                  <div 
                                    className="bg-accent h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, (stats.generations.used / stats.generations.limit) * 100)}%` }}
                                  />
                                </div>
                              )}
                              
                              {/* Downloads */}
                              <div className="pt-1 space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted">PDF Downloads</span>
                                  <span className="font-medium">
                                    {stats.downloads.pdf.limit === 0 ? 'Not available' : 
                                     `${stats.downloads.pdf.used}/${stats.downloads.pdf.limit}${stats.downloads.pdf.period ? ` per ${stats.downloads.pdf.period}` : ''}`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted">DOCX Downloads</span>
                                  <span className="font-medium">
                                    {stats.downloads.docx.limit === 0 ? 'Not available' : 
                                     `${stats.downloads.docx.used}/${stats.downloads.docx.limit}${stats.downloads.docx.period ? ` per ${stats.downloads.docx.period}` : ''}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={handleBillingClick}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{userPlan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}</span>
                        </button>
                        
                        {/* Account Settings */}
                        <Link
                          href="/account"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </Link>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut({ callbackUrl: '/', redirect: true });
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
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
                  className="btn btn-ghost btn-sm focus-ring"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn btn-secondary btn-sm focus-ring"
                >
                  Sign Up
                </Link>
                <Link 
                  href="/wizard" 
                  className="btn btn-primary btn-sm focus-ring"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
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
            <div className="absolute top-full left-0 right-0 z-50 md:hidden bg-surface border border-border shadow-xl rounded-b-lg">
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
                  Create {terms.Resume}
                </Link>
                {session && (
                  <Link 
                    href="/my-resumes" 
                    className={`mobile-nav-link ${router.pathname === '/my-resumes' ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4" />
                    My {terms.ResumePlural}
                  </Link>
                )}
                
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
                          {userPlan === 'free' && entitlement && (
                            <p className="text-xs text-muted">
                              {entitlement.freeWeeklyCreditsRemaining || 0}/10 credits remaining
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
                          <span>{userPlan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}</span>
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
                        <Sparkles className="w-4 h-4 mr-2" />
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
