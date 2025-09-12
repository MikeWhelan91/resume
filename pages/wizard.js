import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Clock, AlertCircle } from 'lucide-react';
import ResumeWizard from '../components/ResumeWizard';

export default function WizardPage(){
  const router = useRouter();
  const { data: session } = useSession();
  const [initial, setInitial] = useState(undefined);
  const [template, setTemplate] = useState('classic');
  const [hasLatestResume, setHasLatestResume] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [showRecentCVSection, setShowRecentCVSection] = useState(true);

  useEffect(()=>{
    // Check localStorage first
    let saved = null;
    try{ saved = JSON.parse(localStorage.getItem('resumeWizardDraft')||'null'); }catch{}
    setInitial(saved || null);

    // Check for saved resume if user is logged in
    if (session?.user) {
      checkForLatestResume();
    }
  },[session]);

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
      alert('Failed to load your most recent CV. Please try again.');
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

  if(initial === undefined) return null;

  return (
    <>
      <Head>
        <title>Resume Wizard – TailoredCV.app</title>
        <meta name="description" content="Step-by-step CV builder with real-time template rendering and one-click PDF downloads." />
      </Head>
      
      {/* Use Most Recent CV Section */}
      {session?.user && hasLatestResume && showRecentCVSection && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">
                  Continue with your most recent CV
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  We found a previously saved resume. You can continue editing it or start fresh.
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-3">
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
                          Use Most Recent CV
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
                  <div className="text-xs text-blue-600">
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
