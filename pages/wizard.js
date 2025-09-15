import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Lock } from 'lucide-react';
import ResumeWizard from '../components/ResumeWizard';
import SeoHead from '../components/SeoHead';

export default function WizardPage(){
  const router = useRouter();
  const { data: session } = useSession();
  const [initial, setInitial] = useState(undefined);
  const [template, setTemplate] = useState('classic');
  const [authCheck, setAuthCheck] = useState(null);
  const [checking, setChecking] = useState(false); // Start as false to show UI immediately

  useEffect(()=>{
    // Check localStorage first
    let saved = null;
    try{ saved = JSON.parse(localStorage.getItem('resumeWizardDraft')||'null'); }catch{}
    setInitial(saved || null);

    // Check if user can access the wizard in background
    // Only check when they actually try to generate
  },[]);

  const checkAuthStatus = async () => {
    if (authCheck) return authCheck; // Return cached result if available

    setChecking(true);
    try {
      const response = await fetch('/api/auth-check');
      const data = await response.json();
      setAuthCheck(data);
      return data;
    } catch (error) {
      console.error('Error checking auth status:', error);
      // If check fails, assume no access for safety
      const errorResult = { authenticated: false, canAccess: false, reason: 'Unable to verify access' };
      setAuthCheck(errorResult);
      return errorResult;
    } finally {
      setChecking(false);
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

  // Show loading state only while loading initial data
  if(initial === undefined) return null;

  // Only show access denied if we've actually checked and it failed
  // Don't block wizard loading, only block generation
  if (false) { // Disable this check - we'll check during generation instead
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

      <ResumeWizard
        initialData={initial}
        onComplete={handleComplete}
        autosaveKey="resumeWizardDraft"
        template={template}
        onTemplateChange={setTemplate}
        onAuthCheck={checkAuthStatus}
      />
    </>
  );
}
