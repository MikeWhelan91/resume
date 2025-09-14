import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Clock, AlertCircle, Lock } from 'lucide-react';
import ResumeWizard from '../components/ResumeWizard';
import SeoHead from '../components/SeoHead';

export default function WizardPage(){
  const router = useRouter();
  const { data: session } = useSession();
  const [initial, setInitial] = useState(undefined);
  const [template, setTemplate] = useState('classic');
  const [hasLatestResume, setHasLatestResume] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [showRecentCVSection, setShowRecentCVSection] = useState(true);
  const [authCheck, setAuthCheck] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(()=>{
    // Check localStorage first
    let saved = null;
    try{ saved = JSON.parse(localStorage.getItem('resumeWizardDraft')||'null'); }catch{}
    setInitial(saved || null);

    // Check for saved resume if user is logged in
    if (session?.user) {
      checkForLatestResume();
    }
    
    // Check if user can access the wizard
    checkAuthStatus();
  },[session]);

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
      setChecking(false);
    }
  };

  const checkForLatestResume = async () => {
    try {
      const response = await fetch('/api/resumes/latest');
      if (response.ok) {
        setHasLatestResume(true);
      } else {
        setHasLatestResume(false);
      }
    } catch (error) {
      console.error('Error checking for latest resume:', error);
      setHasLatestResume(false);
    }
  };

  const loadLatestResume = async () => {
    setLoadingLatest(true);
    try {
      const response = await fetch('/api/resumes/latest');
      if (response.ok) {
        const data = await response.json();
        setInitial(data.data);
        setTemplate(data.template || 'classic');
        setShowRecentCVSection(false);
        // Clear localStorage draft since we're using saved data
        localStorage.removeItem('resumeWizardDraft');
      } else {
        throw new Error('Failed to load resume');
      }
    } catch (error) {
      console.error('Error loading latest resume:', error);
      alert('Failed to load your most recent resume. Please try again.');
    } finally {
      setLoadingLatest(false);
    }
  };

  async function handleComplete(result){
    localStorage.setItem('resumeResult', JSON.stringify(result));
    
    // Auto-save the resume if user is logged in
    if (session?.user) {
      try {
        await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: result.resumeData,
            template: result.template || template,
            name: result.resumeData?.name ? `${result.resumeData.name}'s Resume` : undefined
          })
        });
      } catch (error) {
        console.error('Error auto-saving resume:', error);
        // Don't block the user flow if auto-save fails
      }
    }
    
    router.push('/results');
  }

  // Show loading state while checking
  if(checking || initial === undefined) return null;

  // Show access denied if user cannot access wizard
  if (authCheck && !authCheck.canAccess) {
    return (
      <>
        <SeoHead
          title="Resume Wizard – TailoredCV.app"
          description="Step-by-step resume builder with real-time template rendering and one-click PDF downloads."
          canonical="https://tailoredcv.app/wizard"
          robots="noindex,nofollow"
        />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <Lock className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Access Not Available
            </h2>
            <p className="text-red-700 mb-6">
              {authCheck.reason || 'You do not have access to the resume wizard.'}
            </p>
            
            {authCheck.authenticated ? (
              // Authenticated user - show upgrade options
              <div className="space-y-4">
                <p className="text-sm text-red-600">
                  {authCheck.plan && authCheck.credits 
                    ? `Current plan: ${authCheck.plan} (${authCheck.credits.remaining}/${authCheck.credits.limit} credits remaining)`
                    : 'Your current plan does not include access to resume generation.'
                  }
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => router.push('/pricing')}
                    className="btn btn-primary"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={() => router.push('/account')}
                    className="btn btn-ghost"
                  >
                    View Account
                  </button>
                </div>
              </div>
            ) : (
              // Anonymous user - show sign up or login options
              <div className="space-y-4">
                <p className="text-sm text-red-600">
                  {authCheck.generationsRemaining !== undefined 
                    ? `You have used all ${authCheck.generationsLimit || 2} free trials.`
                    : 'Trial access has been exhausted.'
                  }
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="btn btn-primary"
                  >
                    Sign Up for Free
                  </button>
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="btn btn-ghost"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-red-200">
              <button
                onClick={() => router.push('/')}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title="Resume Wizard – TailoredCV.app"
        description="Step-by-step resume builder with real-time template rendering and one-click PDF downloads."
        canonical="https://tailoredcv.app/wizard"
        robots="noindex,nofollow"
      />
      
      {/* Use Most Recent Resume Section */}
      {session?.user && hasLatestResume && showRecentCVSection && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">
                  Continue with your most recent resume
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  We found a previously saved resume. You can continue editing it or start fresh.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={loadLatestResume}
                      disabled={loadingLatest}
                      className="btn btn-primary btn-sm"
                    >
                      {loadingLatest ? (
                        <>
                          <div className="loading-spinner w-4 h-4 mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Use Most Recent Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRecentCVSection(false)}
                      className="btn btn-ghost btn-sm text-blue-700 hover:text-blue-900"
                    >
                      Start Fresh
                    </button>
                  </div>
                  <div className="text-xs text-blue-600 text-center sm:text-right">
                    Auto-saved resumes expire based on your plan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResumeWizard initialData={initial} onComplete={handleComplete} autosaveKey="resumeWizardDraft" template={template} onTemplateChange={setTemplate} />
    </>
  );
}
