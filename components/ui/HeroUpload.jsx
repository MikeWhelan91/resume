import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Upload, Sparkles, ArrowRight, Zap, Shield, Star, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HeroUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const { getTerminology } = useLanguage();
  const terms = getTerminology();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hasLatestResume, setHasLatestResume] = useState(false);
  const [checkingResume, setCheckingResume] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkForLatestResume();
    }
  }, [session]);

  const checkForLatestResume = async () => {
    try {
      const response = await fetch('/api/resumes/latest');
      setHasLatestResume(response.ok);
    } catch (error) {
      console.error('Error checking for latest resume:', error);
      setHasLatestResume(false);
    }
  };

  const loadLatestResume = async () => {
    setCheckingResume(true);
    setLoadingMessage(`Loading your most recent ${terms.resume}...`);
    try {
      const response = await fetch('/api/resumes/latest');
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.data));
        setLoadingMessage('Perfect! Taking you to the wizard...');
        setTimeout(() => router.push('/wizard'), 500);
      } else {
        alert(`Failed to load your most recent ${terms.resume}. Please try again.`);
      }
    } catch (error) {
      console.error('Error loading latest resume:', error);
      alert(`Failed to load your most recent ${terms.resume}. Please try again.`);
    } finally {
      setCheckingResume(false);
      setLoadingMessage('');
    }
  };

  async function handleFile(e){
    const f = e.target.files?.[0];
    if(!f) return;
    setLoading(true);
    setLoadingMessage('Uploading file...');
    try{
      const fd = new FormData();
      fd.append('resume', f);
      setLoadingMessage(`Extracting text from ${terms.resume}...`);
      const res = await fetch('/api/parse-resume',{method:'POST', body:fd});
      setLoadingMessage('AI analysing your experience...');
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.resumeData||{}));
        setLoadingMessage('Perfect! Taking you to the wizard...');
        setTimeout(() => router.push('/wizard'), 500); // Small delay for user feedback
      } else {
        alert(data.error || `Failed to process ${terms.resume}`);
      }
    } catch(err) {
      alert(`Failed to process ${terms.resume}. Please try again.`);
    } finally{ 
      setLoading(false); 
      setLoadingMessage('');
    }
  }

  function handleCreateNew(){
    // Clear any existing draft and go directly to wizard
    localStorage.removeItem('resumeWizardDraft');
    router.push('/wizard');
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-purple-50"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered {terms.Resume} Optimisation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Get Hired Faster with{' '}
              <span className="text-gradient">Job-Specific {terms.ResumePlural}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 animate-slide-up" style={{animationDelay: '0.1s'}}>
              Simply paste any job description and watch our AI transform your {terms.resume} and cover letter to match perfectly. Get tailored documents for every application that beat ATS systems and land interviews.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFile} className="hidden" />
              
              {/* Show "Use Most Recent Resume" button for logged-in users with saved resumes */}
              {session?.user && hasLatestResume && (
                <button 
                  className="btn btn-primary btn-lg group" 
                  onClick={loadLatestResume}
                  disabled={loading || checkingResume}
                >
                  <Clock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Use Most Recent {terms.Resume}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              
              <button 
                className={`btn ${session?.user && hasLatestResume ? 'btn-secondary' : 'btn-primary'} btn-lg group`}
                onClick={()=>fileRef.current?.click()} 
                disabled={loading || checkingResume}
              >
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Upload Your {terms.Resume}
                {!(session?.user && hasLatestResume) && <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              <button 
                className="btn btn-secondary btn-lg group" 
                onClick={handleCreateNew} 
                disabled={loading || checkingResume}
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Start From Scratch
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>100% Private & Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Generated in Seconds</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>ATS-Optimized</span>
              </div>
            </div>

            {/* Pricing Link */}
            <div className="mt-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <a href="/pricing" className="text-sm text-blue-600 hover:text-blue-700 underline">
                View Pricing Plans
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">From Job Description to Perfect Match</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform any job posting into a winning application in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Your {terms.Resume}</h3>
              <p className="text-gray-600">Upload your existing {terms.resume} or build one from scratch using our smart wizard.</p>
            </div>
            
            <div className="card text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Paste Job Description</h3>
              <p className="text-gray-600">Copy any job posting and our AI instantly analyses the requirements to tailor your {terms.resume} and cover letter.</p>
            </div>
            
            <div className="card text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Tailor Documents</h3>
              <p className="text-gray-600">Download perfectly tailored {terms.resume} and cover letter optimised for that specific job – repeat for every application!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="py-20 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Apply to Multiple Jobs</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            One {terms.Resume}, <span className="text-gradient">Unlimited Tailored Versions</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop sending the same generic {terms.resume} to every job. Create a perfectly matched application for each position by simply pasting the job description. The more jobs you apply to, the better your chances!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-blue-600 mb-2">10x</div>
              <div className="text-sm text-gray-600">Faster Application Process</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">ATS Compatibility Rate</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-green-600 mb-2">3x</div>
              <div className="text-sm text-gray-600">More Interview Callbacks</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              className="btn btn-primary btn-lg group" 
              onClick={()=>fileRef.current?.click()} 
              disabled={loading}
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Start Tailoring Now
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              className="btn btn-secondary btn-lg group" 
              onClick={handleCreateNew} 
              disabled={loading}
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Build From Scratch
            </button>
          </div>
        </div>
      </div>

      {/* Modern Loading Screen */}
      {(loading || checkingResume) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-8 max-w-sm w-full text-center space-y-6 animate-scale-in">
            <div className="loading-spinner w-12 h-12 mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {checkingResume ? `Loading Your ${terms.Resume}` : `Processing Your ${terms.Resume}`}
              </h3>
              <p className="text-gray-600">{loadingMessage}</p>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
