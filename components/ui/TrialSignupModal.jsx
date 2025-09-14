import { useState } from 'react';
import { X, Crown, Check, Sparkles, Clock } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TrialSignupModal({ 
  isOpen, 
  onClose, 
  type = 'post_generation', // 'post_generation' or 'no_credits'
  remainingCredits = 0 
}) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { getTerminology } = useLanguage();
  const terms = getTerminology();

  if (!isOpen) return null;

  const handleSignIn = async (provider) => {
    setIsSigningIn(true);
    try {
      await signIn(provider, { callbackUrl: window.location.href });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsSigningIn(false);
    }
  };

  // Content for users who just used their trial successfully
  const postGenerationContent = (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">
          Great job! Your {terms.resume} is ready 🎉
        </h2>
        <p className="text-muted mb-4">
          You have <strong>{remainingCredits} trial generations left</strong>. Sign up to unlock more benefits!
        </p>
      </div>

      {/* Benefits comparison */}
      <div className="bg-blue-50 dark:bg-gray-800/60 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-text mb-4 text-center">
          Why sign up? Get way more value! 📈
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="font-medium text-gray-700 mb-2">🚀 Trial (You)</div>
            <ul className="space-y-1 text-gray-600">
              <li>• 2 total generations</li>
              <li>• PDF downloads only</li>
              <li>• Basic templates</li>
            </ul>
          </div>
          
          <div className="bg-surface rounded-lg p-4 border-2 border-green-300">
            <div className="font-medium text-green-700 mb-2">📈 Free Account</div>
            <ul className="space-y-1 text-green-600">
              <li className="flex items-center"><Check className="w-3 h-3 mr-1" /> <strong>10 generations/week</strong></li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-1" /> PDF + DOCX downloads</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-1" /> Professional template</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-1" /> Save unlimited {terms.resumePlural}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mb-6">
        💡 <strong>Pro tip:</strong> Most users apply to 5-10 jobs per week. Free accounts give you enough generations for serious job hunting!
      </div>
    </>
  );

  // Content for users who have no credits left
  const noCreditsContent = (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">
          Trial credits used up
        </h2>
        <p className="text-gray-600 mb-4">
          You've used all <strong>2 trial generations</strong>. Sign up to continue with 10 free generations per week!
        </p>
      </div>

      {/* Value proposition */}
      <div className="bg-blue-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Continue your job search with a free account 🚀
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">10 personalized {terms.resumePlural} per week</div>
              <div className="text-gray-600">5x more than your trial - enough for serious job hunting</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">PDF + DOCX downloads</div>
              <div className="text-gray-600">Professional formats accepted everywhere</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Professional template</div>
              <div className="text-gray-600">Clean, ATS-friendly design</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mb-6">
        ✨ <strong>Still completely free</strong> - no credit card required, ever!
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative max-w-lg w-full bg-surface text-text rounded-2xl shadow-2xl border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-8">
          {type === 'post_generation' ? postGenerationContent : noCreditsContent}

          {/* Sign in buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSignIn('google')}
              disabled={isSigningIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSignIn('github')}
              disabled={isSigningIn}
              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy Policy.
              <br />
              <strong>No spam, ever.</strong> We only email you about your account.
            </p>
          </div>
          
          {/* Skip option for post-generation */}
          {type === 'post_generation' && (
            <div className="text-center mt-4">
              <button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 underline transition-colors"
              >
                Maybe later, I'll continue as trial user
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
