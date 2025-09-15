import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function StepNav({ steps, current, onChange, allowNext=true, onNext, onPrev, showButtons=false, isGenerating=false, disabledMessage }) {
  useEffect(() => {
    function onKey(e){
      if(e.key==='ArrowRight' && current < steps.length-1 && allowNext) onChange(current+1);
      if(e.key==='ArrowLeft' && current>0) onChange(current-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, steps.length, allowNext, onChange]);

  const progressPercentage = Math.round(((current + 1) / steps.length) * 100);

  return (
    <nav className="mb-6">
      {/* Desktop: Progress bar with percentage */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex-1 pr-8">
          <div className="flex items-center justify-between text-sm text-muted mb-3">
            <span>Step {current + 1} of {steps.length}: {steps[current]}</span>
            <span className="font-medium text-accent">{progressPercentage}% Complete</span>
          </div>
          <div className="h-3 bg-border/50 rounded-full">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{width:`${progressPercentage}%`}}
            />
          </div>
        </div>
        
        {showButtons && (
          <div className="flex items-center gap-3 ml-8">
            <button 
              type="button" 
              onClick={onPrev} 
              disabled={current === 0} 
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex flex-col items-end">
              <button 
                type="button" 
                onClick={onNext} 
                disabled={!allowNext || isGenerating} 
                className="btn btn-primary flex items-center gap-2"
              >
                {isGenerating && (
                  <div className="loading-spinner w-4 h-4"></div>
                )}
                {current === steps.length - 1 ? (
                  isGenerating ? 'Generating...' : 'Generate Documents'
                ) : (
                  'Next'
                )}
                {!isGenerating && current < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
              {current === steps.length - 1 && !allowNext && !isGenerating && disabledMessage && (
                <p className="text-xs text-red-600 mt-1 text-right max-w-xs">{disabledMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile: Progress bar with buttons */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between text-sm text-muted mb-2">
          <span>Step {current + 1} of {steps.length}: {steps[current]}</span>
          <span className="font-medium text-accent">{progressPercentage}%</span>
        </div>
        <div className="h-2 bg-border/50 rounded-full">
          <div className="h-full bg-accent rounded-full transition-all duration-500 ease-out" style={{width:`${progressPercentage}%`}} />
        </div>
        
        {showButtons && (
          <div className="flex items-center justify-between pt-2">
            <button 
              type="button" 
              onClick={onPrev} 
              disabled={current === 0} 
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex flex-col items-end flex-1">
              <button 
                type="button" 
                onClick={onNext} 
                disabled={!allowNext || isGenerating} 
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                {isGenerating && (
                  <div className="loading-spinner w-3 h-3"></div>
                )}
                {current === steps.length - 1 ? (
                  isGenerating ? 'Generating...' : 'Generate'
                ) : (
                  'Next'
                )}
                {!isGenerating && current < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
              {current === steps.length - 1 && !allowNext && !isGenerating && disabledMessage && (
                <p className="text-xs text-red-600 mt-1 text-right max-w-xs">{disabledMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
