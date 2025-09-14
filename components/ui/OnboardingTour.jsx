import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';

const defaultTourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to TailoredCV!',
    description: 'Create job-specific resumes and cover letters that beat ATS systems and land interviews.',
    target: null, // Full screen overlay
    position: 'center'
  },
  {
    id: 'upload-options',
    title: 'Three Ways to Start',
    description: 'Upload your existing resume, use a recent one, or build from scratch. We\'ll extract your information automatically.',
    target: '[data-tour="upload-options"]',
    position: 'bottom'
  },
  {
    id: 'trial-info',
    title: 'Try It Free',
    description: 'Get started with our free trial - no signup required. Create your first tailored resume in minutes!',
    target: '[data-tour="get-started"]',
    position: 'top'
  },
  {
    id: 'process-overview',
    title: 'The Magic Happens Here',
    description: 'Simply paste any job description and watch our AI transform your resume to match perfectly.',
    target: '[data-tour="process-steps"]',
    position: 'top'
  }
];

export default function OnboardingTour({ 
  steps = defaultTourSteps, 
  onComplete, 
  storageKey = 'onboarding_completed',
  autoStart = true 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user has already completed onboarding and if FirstTimeUserGuide is done
    const hasCompletedOnboarding = localStorage.getItem(storageKey) === 'true';
    const hasSeenFirstTimeGuide = localStorage.getItem('first_time_guide_shown') === 'true';
    
    if (!hasCompletedOnboarding && autoStart && hasSeenFirstTimeGuide) {
      // Wait for page to be fully loaded and FirstTimeUserGuide to be dismissed
      const timer = setTimeout(() => {
        setIsReady(true);
        // Additional delay to ensure elements are rendered
        setTimeout(() => {
          setIsActive(true);
        }, 500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [storageKey, autoStart]);

  useEffect(() => {
    if (isActive && steps[currentStep]?.target) {
      // Add a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        const element = document.querySelector(steps[currentStep].target);
        setTargetElement(element);
        
        // Scroll element into view with better positioning
        if (element) {
          const elementRect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Only scroll if element is not visible
          if (elementRect.top < 100 || elementRect.bottom > viewportHeight - 100) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center' 
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setTargetElement(null);
    }
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem(storageKey, 'true');
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const getTooltipPosition = () => {
    if (!targetElement) {
      return { 
        top: '50%', 
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
    
    const rect = targetElement.getBoundingClientRect();
    const step = steps[currentStep];
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 384; // max-w-sm = 24rem = 384px
    const tooltipHeight = 300; // estimated height
    
    let position = step.position;
    
    // Auto-adjust position if tooltip would go off-screen
    if (position === 'top' && rect.top - tooltipHeight < 20) {
      position = 'bottom';
    } else if (position === 'bottom' && rect.bottom + tooltipHeight > viewportHeight - 20) {
      position = 'top';
    } else if (position === 'left' && rect.left - tooltipWidth < 20) {
      position = 'right';
    } else if (position === 'right' && rect.right + tooltipWidth > viewportWidth - 20) {
      position = 'left';
    }
    
    switch (position) {
      case 'top':
        return {
          top: Math.max(20, rect.top - 20),
          left: Math.min(Math.max(20, rect.left + rect.width / 2), viewportWidth - 20),
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: Math.min(rect.bottom + 20, viewportHeight - tooltipHeight - 20),
          left: Math.min(Math.max(20, rect.left + rect.width / 2), viewportWidth - 20),
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: Math.min(Math.max(20, rect.top + rect.height / 2), viewportHeight - 20),
          left: Math.max(20, rect.left - 20),
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: Math.min(Math.max(20, rect.top + rect.height / 2), viewportHeight - 20),
          left: Math.min(rect.right + 20, viewportWidth - tooltipWidth - 20),
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  const currentStepData = steps[currentStep];

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm">
        {/* Spotlight effect for targeted elements */}
        {targetElement && (
          <div
            className="absolute bg-white/10 rounded-lg border-2 border-blue-400 shadow-[0_0_0_4px_rgba(59,130,246,0.3)] animate-pulse"
            style={{
              top: targetElement.getBoundingClientRect().top - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[51] max-w-sm"
        style={getTooltipPosition()}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 animate-scale-in">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-blue-600 scale-125'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="btn btn-ghost btn-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="btn btn-primary btn-sm"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip link */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to manually trigger onboarding tour
export function useOnboardingTour(storageKey = 'onboarding_completed') {
  const [isActive, setIsActive] = useState(false);

  const startTour = () => {
    setIsActive(true);
    // Remove completed flag to restart tour
    localStorage.removeItem(storageKey);
  };

  const resetTour = () => {
    localStorage.removeItem(storageKey);
  };

  const hasCompletedTour = () => {
    return localStorage.getItem(storageKey) === 'true';
  };

  return {
    startTour,
    resetTour,
    hasCompletedTour,
    isActive
  };
}