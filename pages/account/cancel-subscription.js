import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ExternalLink, CreditCard, CheckCircle } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function CancelSubscription() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    fetchEntitlements();
  }, [session, status, router]);

  const fetchEntitlements = async () => {
    try {
      const response = await fetch('/api/entitlements');
      if (response.ok) {
        const data = await response.json();
        setEntitlement(data);
        
        // Redirect standard users back to account page (no active subscription)
        if (data.plan === 'standard' || data.plan === 'free') {
          router.push('/account');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.code === 'PORTAL_NOT_CONFIGURED') {
          alert(`${errorData.message}\n\nTo cancel your subscription, please contact: ${errorData.supportEmail || 'support@tailoredcv.app'}`);
        } else {
          alert(errorData.message || 'Unable to open billing portal. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Unable to process cancellation. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-4 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const planDisplayNames = {
    pro_monthly: 'Pro Monthly',
    pro_annual: 'Pro Annual'
  };

  return (
    <>
      <SeoHead
        title="Cancel Subscription - TailoredCV.app"
        description="Cancel your TailoredCV.app subscription"
        canonical="https://tailoredcv.app/account/cancel-subscription"
        robots="noindex,nofollow"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
          <Link 
            href="/account"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account Settings
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">Cancel Subscription</h1>
            <p className="text-muted">We're sorry to see you go!</p>
          </div>

          <div className="space-y-8">
            
            {/* Current Plan Info */}
            <div className="bg-surface text-text rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                <h2 className="text-lg font-semibold text-text">Current Subscription</h2>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-text">
                      {planDisplayNames[entitlement?.plan] || 'Loading...'}
                    </p>
                    <p className="text-sm text-muted">Active subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted">Next billing</p>
                    <p className="text-sm font-medium text-text">
                      {entitlement?.plan === 'pro_annual' ? 'Annual' : 'Monthly'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What You'll Lose */}
            <div className="bg-surface text-text rounded-lg shadow-sm border border-orange-200 p-6">
              <h2 className="text-lg font-semibold text-text mb-4">What you'll lose after cancellation:</h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-text font-medium">Unlimited document generations</p>
                    <p className="text-sm text-muted">You'll return to the Standard plan with monthly free credits and paid credit packs.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-text font-medium">DOCX downloads</p>
                    <p className="text-sm text-muted">Only PDF downloads will be available</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-text font-medium">Premium templates</p>
                    <p className="text-sm text-muted">Access limited to Professional template only</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-text font-medium">Priority support</p>
                    <p className="text-sm text-muted">Standard support response times will apply</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Retention Offer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">Before you go...</h2>
              <p className="text-blue-800 mb-4">
                Is there anything we can do to improve your experience? We'd love to hear your feedback.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/support"
                  className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-surface hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Share Feedback
                </Link>
                <Link 
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Other Plans
                </Link>
              </div>
            </div>

            {/* Cancellation Process */}
            <div className="bg-surface text-text rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-text mb-4">How cancellation works:</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-text font-medium">Keep access until billing period ends</p>
                    <p className="text-sm text-muted">
                      You'll retain Pro features until the end of your current billing cycle
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-text font-medium">No immediate charges</p>
                    <p className="text-sm text-muted">Your subscription will simply not renew</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-text font-medium">Easy to resubscribe</p>
                    <p className="text-sm text-muted">You can upgrade again anytime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-surface text-text rounded-lg shadow-sm border border-border p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-red-300 text-base font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-red-300 border-t-red-500 rounded-full"></div>
                      Opening Billing Portal...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Cancel My Subscription
                    </>
                  )}
                </button>
                
                <Link 
                  href="/account"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-md text-text bg-surface hover:bg-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Keep My Subscription
                </Link>
              </div>
              
              <p className="text-xs text-muted mt-4 text-center">
                This will open Stripe's secure billing portal where you can manage your subscription.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
