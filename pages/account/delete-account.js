import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Trash2, Shield, Database, FileText, Clock, CheckCircle, X } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function DeleteAccount() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entitlement, setEntitlement] = useState(null);
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1); // 1: Warning, 2: Final Confirmation

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    fetchData();
    
    // Check deletion status every minute if there's a pending deletion
    const interval = setInterval(() => {
      if (deletionStatus?.hasPendingDeletion) {
        checkDeletionStatus();
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [session, status, router]);

  const fetchData = async () => {
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

  const checkDeletionStatus = async () => {
    try {
      const response = await fetch('/api/user/deletion-status');
      if (response.ok) {
        const data = await response.json();
        setDeletionStatus(data);
      }
    } catch (error) {
      console.error('Error checking deletion status:', error);
    }
  };

  const handleRequestDeletion = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type "DELETE" exactly as shown to confirm.');
      return;
    }

    setRequesting(true);
    try {
      const response = await fetch('/api/user/request-deletion', { method: 'POST' });
      
      if (response.ok) {
        const data = await response.json();
        setDeletionStatus({
          hasPendingDeletion: true,
          scheduledFor: data.scheduledFor,
          hoursRemaining: data.hoursRemaining
        });
        setStep(1); // Reset to warning step
        setConfirmText(''); // Clear confirmation text
      } else {
        const error = await response.json();
        alert(`Failed to schedule deletion: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error requesting deletion:', error);
      alert('Failed to schedule deletion. Please try again or contact support.');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      const response = await fetch('/api/user/cancel-deletion', { method: 'POST' });
      
      if (response.ok) {
        setDeletionStatus({ hasPendingDeletion: false });
        alert('Account deletion cancelled successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to cancel deletion: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      alert('Failed to cancel deletion. Please try again or contact support.');
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
    standard: 'Standard User',
    free: 'Standard User',
    pro_monthly: 'Pro Monthly',
    pro_annual: 'Pro Annual'
  };

  // If account deletion is pending
  if (deletionStatus?.hasPendingDeletion) {
    const scheduledDate = new Date(deletionStatus.scheduledFor);
    const hoursRemaining = deletionStatus.hoursRemaining || 0;
    
    return (
      <>
        <SeoHead
          title="Account Deletion Scheduled - TailoredCV.app"
          description="Your account deletion is scheduled"
          canonical="https://tailoredcv.app/account/delete-account"
          robots="noindex,nofollow"
        />

        <div className="min-h-screen bg-red-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-text mb-2">Account Deletion Scheduled</h1>
              <p className="text-lg text-muted">Your account is scheduled for deletion in {hoursRemaining} hours</p>
            </div>

            {/* Deletion Info Card */}
            <div className="bg-surface text-text rounded-xl shadow-lg border border-border p-8 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text mb-4">Deletion Details</h3>
                  <div className="space-y-3 text-text">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Scheduled for:</span>
                      <span>{scheduledDate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Time remaining:</span>
                      <span className="text-orange-600 font-semibold">{hoursRemaining} hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Account:</span>
                      <span>{session.user.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current plan:</span>
                      <span>{planDisplayNames[entitlement?.plan] || 'Standard User'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">What happens during deletion:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• All your resumes and personal data will be permanently deleted</li>
                  <li>• Active subscriptions will be automatically cancelled</li>
                  <li>• Your account cannot be recovered after deletion</li>
                  <li>• You can create a new account, but won't retain any previous data or credits</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleCancelDeletion}
                disabled={cancelling}
                className="btn btn-success btn-lg flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Deletion'}</span>
              </button>
              
              <Link href="/account" className="btn btn-secondary btn-lg flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Account</span>
              </Link>
            </div>

            {/* Help Section */}
            <div className="mt-12 text-center">
              <p className="text-sm text-muted">
                Need help? <a href="mailto:support@tailoredcv.app" className="text-blue-600 hover:underline">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title="Delete Account - TailoredCV.app"
        description="Delete your TailoredCV.app account permanently"
        canonical="https://tailoredcv.app/account/delete-account"
        robots="noindex,nofollow"
      />

      <div className="min-h-screen bg-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Back Button */}
          <div className="mb-8">
            <Link href="/account" className="inline-flex items-center text-muted hover:text-text transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account Settings
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">Delete Account</h1>
            <p className="text-lg text-muted">Permanently delete your TailoredCV.app account and data</p>
          </div>

          {step === 1 && (
            <>
              {/* Warning Card */}
              <div className="bg-surface text-text rounded-xl shadow-lg border border-border p-8 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text mb-4">⚠️ Important: 48-Hour Waiting Period</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-text mb-4">
                        To prevent abuse of our credit system, account deletion has a <strong>48-hour waiting period</strong>. 
                        Here's how it works:
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-800 text-sm mb-2">Deletion Timeline:</h4>
                            <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
                              <li>You request account deletion (now)</li>
                              <li>48-hour waiting period begins</li>
                              <li>You can cancel anytime during these 48 hours</li>
                              <li>After 48 hours, your account is permanently deleted</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Account Info */}
              <div className="bg-surface text-text rounded-xl shadow-lg border border-border p-8 mb-8">
                <h3 className="text-xl font-semibold text-text mb-6 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Your Account Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted">Email</label>
                      <div className="text-text">{session.user.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">Current Plan</label>
                      <div className="text-text">{planDisplayNames[entitlement?.plan] || 'Standard User'}</div>
                    </div>
                    {(entitlement?.plan === 'standard' || entitlement?.plan === 'free') && (
                      <div>
                        <label className="text-sm font-medium text-muted">Credits Remaining</label>
                        <div className="text-text">{(entitlement.freeCreditsThisMonth ?? 0) + (entitlement.creditBalance ?? 0)} remaining</div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted">Member Since</label>
                      <div className="text-text">
                        {session.user.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                    {entitlement?.plan !== 'free' && (
                      <div>
                        <label className="text-sm font-medium text-muted">Subscription Status</label>
                        <div className="text-text capitalize">{entitlement.status || 'Active'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* What Will Be Deleted */}
              <div className="bg-surface text-text rounded-xl shadow-lg border border-border p-8 mb-8">
                <h3 className="text-xl font-semibold text-text mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  What Will Be Permanently Deleted
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-text mb-3">Personal Data</h4>
                    <ul className="space-y-2 text-text">
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        Account profile and settings
                      </li>
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        All saved resumes and templates
                      </li>
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        Generated cover letters
                      </li>
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        Usage history and preferences
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text mb-3">Subscription & Billing</h4>
                    <ul className="space-y-2 text-text">
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        Active subscriptions (auto-cancelled)
                      </li>
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        Remaining credits and benefits
                      </li>
                      <li className="flex items-center">
                        <X className="w-4 h-4 text-red-500 mr-2" />
                        Billing history (kept for legal compliance)
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex">
                    <Shield className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-1">This action cannot be undone</h4>
                      <p className="text-red-700 text-sm">
                        Once your account is deleted after the 48-hour period, all data is permanently removed and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-danger btn-lg"
                >
                  I Understand, Continue to Delete Account
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Final Confirmation */}
            <div className="bg-surface text-text rounded-xl shadow-lg border border-red-200 p-8 mb-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-text mb-2">Final Confirmation</h3>
                  <p className="text-muted">This will schedule your account for deletion in 48 hours</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-muted mb-2">
                      Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="form-input w-full text-center font-mono"
                      placeholder="DELETE"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="btn btn-secondary flex-1"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleRequestDeletion}
                      disabled={requesting || confirmText !== 'DELETE'}
                      className="btn btn-danger flex-1"
                    >
                      {requesting ? 'Scheduling...' : 'Schedule Account Deletion'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Help Section */}
          <div className="text-center">
            <p className="text-sm text-muted">
              Having second thoughts? <Link href="/account" className="text-blue-600 hover:underline">Return to Account Settings</Link>
            </p>
            <p className="text-sm text-muted mt-2">
              Need help? <a href="mailto:support@tailoredcv.app" className="text-blue-600 hover:underline">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
