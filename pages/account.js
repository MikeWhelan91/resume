import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Settings, CreditCard, User, Shield, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function Account() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entitlement, setEntitlement] = useState(null);
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const [entitlementResponse, deletionResponse] = await Promise.all([
        fetch('/api/entitlements'),
        fetch('/api/user/deletion-status')
      ]);
      
      if (entitlementResponse.ok) {
        const data = await entitlementResponse.json();
        setEntitlement(data);
      }
      
      if (deletionResponse.ok) {
        const data = await deletionResponse.json();
        setDeletionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBillingPortal = async () => {
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
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const planDisplayNames = {
    free: 'Free Plan',
    pro_monthly: 'Pro Monthly',
    pro_yearly: 'Pro Yearly', 
    day_pass: 'Day Pass'
  };

  return (
    <>
      <SeoHead
        title="Account Settings - TailoredCV.app"
        description="Manage your account settings, billing, and subscription."
        canonical="https://tailoredcv.app/account"
        robots="noindex,nofollow"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="w-8 h-8 mr-3 text-indigo-600" />
              Account Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage your account, billing, and preferences</p>
          </div>

          {/* Deletion Warning Banner */}
          {deletionStatus?.hasPendingDeletion && (
            <div className="mb-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Account Deletion Scheduled</h3>
                  <p className="text-orange-700 mb-4">
                    Your account is scheduled for deletion in <strong>{deletionStatus.hoursRemaining || 0} hours</strong>.
                    You can cancel this at any time during the 48-hour waiting period.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href="/account/delete-account" 
                      className="btn btn-warning btn-sm inline-flex items-center"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      View Details & Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Profile Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 mr-2 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{session.user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{session.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Billing & Subscription */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Billing & Subscription</h2>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Plan</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      {planDisplayNames[entitlement?.plan] || 'Loading...'}
                    </p>
                  </div>
                  
                  {entitlement?.plan === 'free' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Weekly Credits</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {entitlement?.freeWeeklyCreditsRemaining || 0} / 10 remaining
                        </p>
                        <p className="text-xs text-gray-500">Credits reset every Monday at midnight Dublin time</p>
                      </div>
                      
                      <Link 
                        href="/pricing"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleBillingPortal}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Billing
                      </button>
                      
                      <div className="text-sm text-gray-600">
                        <p>• Update payment methods</p>
                        <p>• View billing history</p>
                        <p>• Download invoices</p>
                      </div>
                      
                      <Link 
                        href="/account/cancel-subscription"
                        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Cancel Subscription
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Once you delete your account, there is no going back. This action cannot be undone.
                  </p>
                  
                  <Link 
                    href="/account/delete-account"
                    className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Delete Account
                  </Link>
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-3">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  <h3 className="font-medium text-gray-900">Account Security</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Your account is secured with OAuth authentication.</p>
                <div className="text-xs text-gray-500">
                  <p>• No passwords to manage</p>
                  <p>• Secure third-party login</p>
                  <p>• Regular security updates</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Have questions about your account or billing?
                </p>
                <Link 
                  href="/support"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Contact Support →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}