import { useState, useEffect } from 'react';
import { Crown, CreditCard, Calendar, AlertCircle, ExternalLink, Check, X, Clock, Loader } from 'lucide-react';

export default function SubscriptionManager({ entitlement, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [entitlement]);

  const fetchSubscriptionInfo = async () => {
    if (!entitlement || entitlement.plan === 'free') return;
    
    try {
      const response = await fetch('/api/stripe/subscription-info');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
    }
  };

  const formatCancellationDate = (canceledAt) => {
    if (!canceledAt) return null;
    const date = new Date(canceledAt);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanDetails = (plan) => {
    const plans = {
      free: {
        name: 'Free',
        price: 'Free',
        features: ['10 resumes/week', 'PDF downloads only', 'Basic templates'],
        color: 'gray'
      },
      day_pass: {
        name: 'Day Pass',
        price: '€2.99/24h',
        features: ['30 resumes/day', 'PDF & DOCX downloads', 'All templates'],
        color: 'blue'
      },
      pro_monthly: {
        name: 'Pro Monthly',
        price: '€9.99/month',
        features: ['Unlimited resumes', 'PDF & DOCX downloads', 'All templates', 'Priority support'],
        color: 'purple'
      },
      pro_annual: {
        name: 'Pro Annual',
        price: '€69/year',
        features: ['Unlimited resumes', 'PDF & DOCX downloads', 'All templates', 'Priority support', '42% savings'],
        color: 'green'
      }
    };
    return plans[plan] || plans.free;
  };

  const formatExpiryDate = (expiresAt) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const hoursRemaining = Math.ceil((date - now) / (1000 * 60 * 60));
    
    if (hoursRemaining <= 0) return 'Expired';
    if (hoursRemaining < 24) return `${hoursRemaining} hours remaining`;
    
    const daysRemaining = Math.ceil(hoursRemaining / 24);
    return `${daysRemaining} days remaining`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', color: 'green', icon: Check },
      past_due: { label: 'Past Due', color: 'yellow', icon: AlertCircle },
      canceled: { label: 'Canceled', color: 'gray', icon: X },
      inactive: { label: 'Inactive', color: 'red', icon: X }
    };
    
    const badge = badges[status] || badges.inactive;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const handleBillingPortal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        window.open(data.url, '_blank');
      } else {
        if (data.code === 'PORTAL_NOT_CONFIGURED') {
          setError('Billing portal is being configured. Please contact support for billing assistance.');
        } else {
          setError(data.message || 'Unable to open billing portal.');
        }
      }
    } catch (err) {
      setError('Failed to connect to billing system. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planType) => {
    // This would redirect to your pricing page or trigger checkout
    window.location.href = `/pricing${planType ? `#${planType}` : ''}`;
  };

  if (!entitlement) {
    return (
      <div className="bg-surface text-text rounded-lg border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const planDetails = getPlanDetails(entitlement.plan);
  const isFreePlan = entitlement.plan === 'free';
  const isDayPass = entitlement.plan === 'day_pass';
  const isProPlan = entitlement.plan?.startsWith('pro_');

  return (
    <div className="bg-surface text-text rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${planDetails.color}-100`}>
            {isFreePlan ? (
              <CreditCard className={`w-5 h-5 text-${planDetails.color}-600`} />
            ) : (
              <Crown className={`w-5 h-5 text-${planDetails.color}-600`} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">{planDetails.name}</h3>
            <p className="text-sm text-muted">{planDetails.price}</p>
          </div>
        </div>
        {getStatusBadge(entitlement.status)}
      </div>

      {/* Plan Features */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-3">Plan Includes:</h4>
        <ul className="space-y-2">
          {planDetails.features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Usage Information */}
      {isFreePlan && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Weekly Usage</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">Credits Used:</span>
            <span className="font-medium text-blue-900">
              {10 - (entitlement.freeWeeklyCreditsRemaining || 0)}/10
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((10 - (entitlement.freeWeeklyCreditsRemaining || 0)) / 10) * 100}%` 
              }}
            />
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Credits reset every Monday at midnight Dublin time
          </p>
        </div>
      )}

      {/* Day Pass Expiry */}
      {isDayPass && entitlement.expiresAt && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Day Pass Status</span>
          </div>
          <p className="text-sm text-orange-800">
            {formatExpiryDate(entitlement.expiresAt)}
          </p>
        </div>
      )}

      {/* Subscription Cancellation Info */}
      {subscriptionInfo?.canceledAt && entitlement.status === 'canceled' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 mb-2">
            <X className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900 dark:text-red-100">Subscription Canceled</span>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200">
            Canceled on {formatCancellationDate(subscriptionInfo.canceledAt)}
          </p>
          {subscriptionInfo.currentPeriodEnd && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Access expires on {new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {isFreePlan ? (
          <button
            onClick={() => handleUpgrade()}
            className="w-full btn btn-primary flex items-center justify-center space-x-2"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to Pro</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleBillingPortal}
              disabled={loading}
              className="w-full btn btn-secondary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>{loading ? 'Opening...' : 'Manage Billing'}</span>
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              Update payment methods, view invoices, or cancel subscription
            </div>
          </div>
        )}

        {/* Quick upgrade options for free users */}
        {isFreePlan && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => handleUpgrade('day_pass')}
              className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
            >
              Day Pass €2.99
            </button>
            <button
              onClick={() => handleUpgrade('pro_monthly')}
              className="btn btn-ghost btn-sm text-purple-600 hover:bg-purple-50"
            >
              Pro €9.99/mo
            </button>
          </div>
        )}
      </div>

      {/* Past Due Warning */}
      {entitlement.status === 'past_due' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Payment Required</p>
              <p className="text-yellow-800">
                Your subscription payment failed. Please update your payment method to restore access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
