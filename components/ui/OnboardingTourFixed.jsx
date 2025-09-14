import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';

const tourSteps = [
  {
    id: 'upload-options',
    title: 'Three Ways to Start',
    description: 'Upload your existing resume, use a recent one, or build from scratch. We\'ll extract your information automatically.',
    target: '[data-tour="upload-options"]',
    position: 'top'
  },
  {
    id: 'process-steps',
    title: 'The Magic Happens Here',
    description: 'Simply paste any job description and watch our AI transform your resume to match perfectly.',
    target: '[data-tour="process-steps"]',
    position: 'top'
  },
  {
    id: 'get-started',
    title: 'Try It Free',
    description: 'Get started with our free trial - no signup required. Create your first tailored resume in minutes!',
    target: '[data-tour="get-started"]',
    position: 'top'
  }
];

export default function OnboardingTourFixed({ 
  onComplete, 
  storageKey = 'hero_onboarding_completed'
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});

  // Listen for manual tour start
  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStep(0);
      setIsActive(true);
    };

    window.addEventListener('startOnboardingTour', handleStartTour);
    return () => window.removeEventListener('startOnboardingTour', handleStartTour);
  }, []);

  // Update target element and positioning when step changes
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      const step = tourSteps[currentStep];
      if (step?.target) {
        const element = document.querySelector(step.target);
        
        if (element) {
          setTargetElement(element);
          
          // Scroll element into view smoothly
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Calculate tooltip position after scrolling
          setTimeout(() => {
            updateTooltipPosition(element, step.position);
          }, 300);
        } else {
          console.warn(`Tour target not found: ${step.target}`);
          // Skip to next step if element not found
          if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
          } else {
            handleComplete();
          }
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep, isActive]);

  const updateTooltipPosition = useCallback((element, preferredPosition) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 400;
    const tooltipHeight = 250;
    const padding = 20;

    let position = preferredPosition;
    let top, left, transform;

    // Determine best position based on available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Auto-adjust position if needed
    if (position === 'top' && spaceAbove < tooltipHeight + padding) {
      position = 'bottom';
    } else if (position === 'bottom' && spaceBelow < tooltipHeight + padding) {
      position = 'top';
    }

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - tooltipWidth - padding;
        transform = 'translateY(-50%)';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + padding;
        transform = 'translateY(-50%)';
        break;
      default:
        top = viewportHeight / 2;
        left = viewportWidth / 2;
        transform = 'translate(-50%, -50%)';
    }

    // Ensure tooltip stays within viewport
    if (left < padding) left = padding;
    if (left > viewportWidth - tooltipWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }
    if (top < padding) top = padding;
    if (top > viewportHeight - tooltipHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    setTooltipStyle({ top, left, transform });
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
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
    setTargetElement(null);
    localStorage.setItem(storageKey, 'true');
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isActive) return null;

  const currentStepData = tourSteps[currentStep];
  if (!currentStepData) return null;

  return (
    <>
      {/* Backdrop with cutout for target element */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        
        {/* Spotlight cutout for target element */}
        {targetElement && (
          <div
            className="absolute border-4 border-blue-400 rounded-lg shadow-[0_0_0_4px_rgba(59,130,246,0.2)] bg-white/5 animate-pulse"
            style={{
              top: targetElement.getBoundingClientRect().top - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              zIndex: 41
            }}
          />
        )}
      </div>

      {/* Tour tooltip */}
      <div
        className="fixed z-50 w-96 max-w-sm"
        style={tooltipStyle}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-scale-in">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              title="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-6 leading-relaxed text-sm">
            {currentStepData.description}
          </p>

          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {tourSteps.map((_, index) => (
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
              {currentStep + 1} of {tourSteps.length}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Done</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip link */}
          <div className="text-center mt-3">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </>
  );
}