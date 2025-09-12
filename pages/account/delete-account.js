import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Trash2, Shield, Database, FileText } from 'lucide-react';

export default function DeleteAccount() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1); // 1: Warning, 2: Final Confirmation

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
      }
    } catch (error) {
      console.error('Error fetching entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type "DELETE" exactly as shown to confirm.');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', { method: 'POST' });
      
      if (response.ok) {
        // Show success message and sign out
        alert('Your account has been successfully deleted. You will now be signed out.');
        await signOut({ callbackUrl: '/' });
      } else {
        const error = await response.json();
        alert(`Failed to delete account: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleting(false);
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
      <Head>
        <title>Delete Account - TailoredCV.app</title>
        <meta name="description" content="Delete your TailoredCV.app account permanently" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
          <Link 
            href="/account"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Account</h1>
            <p className="text-gray-600">This action cannot be undone</p>
          </div>

          {step === 1 && (
            <div className="space-y-8">
              
              {/* Current Account Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="text-gray-900 font-medium">{session.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="text-gray-900 font-medium">{session.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Plan</span>
                    <span className="text-gray-900 font-medium">
                      {planDisplayNames[entitlement?.plan] || 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What Will Be Deleted */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-900">What will be permanently deleted:</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Database className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-red-900 font-medium">All personal data</p>
                      <p className="text-sm text-red-700">Your profile, preferences, and account settings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-red-900 font-medium">Generated documents</p>
                      <p className="text-sm text-red-700">All resumes, cover letters, and saved generations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-red-900 font-medium">Authentication data</p>
                      <p className="text-sm text-red-700">OAuth connections and login sessions</p>
                    </div>
                  </div>
                  
                  {entitlement?.plan !== 'free' && (
                    <div className="flex items-start">
                      <Trash2 className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-red-900 font-medium">Subscription and billing</p>
                        <p className="text-sm text-red-700">Active subscriptions will be cancelled immediately</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Retention Policy */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">Important Notes:</h2>
                <div className="space-y-2 text-blue-800">
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    This action is immediate and cannot be undone
                  </p>
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You will be signed out immediately after deletion
                  </p>
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Some data may be retained for legal compliance (30 days max)
                  </p>
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You can create a new account anytime with the same email
                  </p>
                </div>
              </div>

              {/* Alternative Actions */}
              {entitlement?.plan !== 'free' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Consider these alternatives:</h2>
                  
                  <div className="space-y-3">
                    <Link 
                      href="/account/cancel-subscription"
                      className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Cancel subscription only</p>
                          <p className="text-sm text-gray-600">Keep your account but downgrade to free plan</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                      </div>
                    </Link>
                    
                    <Link 
                      href="/support"
                      className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Contact support first</p>
                          <p className="text-sm text-gray-600">Let us help resolve any issues you're experiencing</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-red-600 text-base font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  I Understand, Delete My Account
                </button>
                
                <Link 
                  href="/account"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
              </div>

            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              
              {/* Final Warning */}
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-6">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-900 mb-2">Final Warning</h2>
                  <p className="text-red-800">
                    This will permanently delete your account and all associated data.
                    <br />
                    <strong>This action cannot be undone.</strong>
                  </p>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Type "DELETE" to confirm</h2>
                <p className="text-gray-600 mb-4">
                  To proceed with account deletion, please type <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">DELETE</code> in the field below:
                </p>
                
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-mono text-lg"
                  disabled={deleting}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE'}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete My Account Permanently
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setStep(1)}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Go Back
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}