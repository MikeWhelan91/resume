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

  return (
    <nav className="mb-6">
      {/* Desktop: Progress steps with buttons */}
      <div className="hidden md:flex items-center justify-between">
        <ol className="flex items-center gap-4 flex-1">
          {steps.map((s,i)=>{
            const state = i<current ? 'done' : i===current ? 'active' : 'todo';
            return (
              <li key={s} className="flex items-center cursor-pointer" onClick={()=>{ if(i<=current || allowNext) onChange(i); }}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 transition-all duration-200 ${state==='done'?'bg-blue-600 text-white':state==='active'?'border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400':'border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'}`}>{i+1}</span>
                <span className={`text-sm transition-colors ${state==='active'?'text-gray-900 dark:text-white font-medium':'text-gray-500 dark:text-gray-400'}`}>{s}</span>
              </li>
            );
          })}
        </ol>
        
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
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Step {current + 1} of {steps.length}</span>
          <span>{steps[current]}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{width:`${(current)/(steps.length-1)*100}%`}} />
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
