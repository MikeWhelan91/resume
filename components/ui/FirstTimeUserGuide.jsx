import { useState, useEffect } from 'react';
import { X, ArrowRight, Sparkles, Upload, Zap, Download } from 'lucide-react';

export default function FirstTimeUserGuide() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show guide for first-time users
    const hasSeenGuide = localStorage.getItem('first_time_guide_shown') === 'true';
    const isFirstVisit = !document.cookie.includes('visited=true');
    
    if (!hasSeenGuide && isFirstVisit) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('first_time_guide_shown', 'true');
    // Set a cookie to remember the user has visited
    document.cookie = 'visited=true; max-age=31536000; path=/'; // 1 year
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('firstTimeGuideCompleted'));
  };

  const handleGetStarted = () => {
    handleClose();
    // Scroll to the upload section
    document.querySelector('[data-tour="upload-options"]')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Guide Modal */}
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-2xl border border-border animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted hover:text-text transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to TailoredCV! 👋
            </h2>
            <p className="text-muted">
              Transform your job applications with AI-powered resume and cover letter optimization
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">1. Upload Your Resume</h3>
                <p className="text-xs text-muted">Or build one from scratch using our wizard</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">2. Paste Job Description</h3>
                <p className="text-xs text-muted">AI analyzes requirements and tailors your documents</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">3. Download & Apply</h3>
                <p className="text-xs text-muted">Get perfectly matched resume + cover letter</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Why TailoredCV works:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">10x</div>
                  <div className="text-xs text-muted">Faster</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">95%</div>
                  <div className="text-xs text-muted">ATS Pass</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">3x</div>
                  <div className="text-xs text-muted">More Callbacks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Free Trial + Plan Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-green-800 font-semibold text-sm mb-1">✨ Start Completely Free</div>
              <div className="text-green-700 text-xs mb-2">Try immediately - no signup required!</div>
              <div className="text-blue-700 text-xs font-medium">
                📈 Sign up later for 10 personalized CVs & cover letters/week + premium features
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleGetStarted}
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleClose}
              className="w-full btn btn-ghost btn-sm"
            >
              I'll explore on my own
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}