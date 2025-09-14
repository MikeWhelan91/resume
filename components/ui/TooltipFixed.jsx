import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  size = 'md',
  trigger = 'hover',
  showIcon = false,
  persistent = false,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const triggerRef = useRef(null);

  const sizeClasses = {
    sm: 'text-xs px-3 py-2 w-64',
    md: 'text-sm px-3 py-2 w-80', 
    lg: 'text-sm px-4 py-3 w-96',
    xl: 'text-base px-5 py-4 w-[28rem]'
  };

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      updateTooltipPosition();
    }
  }, [isVisible, position]);

  const updateTooltipPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const tooltipWidths = {
      sm: 256, // w-64
      md: 320, // w-80
      lg: 384, // w-96
      xl: 448  // w-[28rem]
    };

    const tooltipWidth = tooltipWidths[size];
    const tooltipHeight = 100; // estimated height
    const gap = 12;

    let top, left, transformOrigin;

    // Calculate position based on preference and available space
    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        transformOrigin = 'bottom center';
        
        // Adjust if tooltip goes off-screen horizontally
        if (left < 10) left = 10;
        if (left + tooltipWidth > viewport.width - 10) {
          left = viewport.width - tooltipWidth - 10;
        }
        
        // If no space above, position below
        if (top < 10) {
          top = rect.bottom + gap;
          transformOrigin = 'top center';
        }
        break;

      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        transformOrigin = 'top center';
        
        // Adjust if tooltip goes off-screen horizontally
        if (left < 10) left = 10;
        if (left + tooltipWidth > viewport.width - 10) {
          left = viewport.width - tooltipWidth - 10;
        }
        
        // If no space below, position above
        if (top + tooltipHeight > viewport.height - 10) {
          top = rect.top - tooltipHeight - gap;
          transformOrigin = 'bottom center';
        }
        break;

      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        transformOrigin = 'center right';
        
        if (left < 10) {
          left = rect.right + gap;
          transformOrigin = 'center left';
        }
        break;

      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        transformOrigin = 'center left';
        
        if (left + tooltipWidth > viewport.width - 10) {
          left = rect.left - tooltipWidth - gap;
          transformOrigin = 'center right';
        }
        break;

      default:
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        transformOrigin = 'top center';
    }

    setTooltipStyle({
      position: 'fixed',
      top: Math.max(10, Math.min(top, viewport.height - tooltipHeight - 10)),
      left: Math.max(10, Math.min(left, viewport.width - tooltipWidth - 10)),
      zIndex: 1000,
      transformOrigin
    });
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className="flex items-center cursor-help">
          {children}
          {showIcon && (
            <HelpCircle className="w-4 h-4 text-muted hover:text-text ml-1 transition-colors" />
          )}
        </div>
      </div>

      {/* Portal-style tooltip */}
      {isVisible && (
        <div
          style={tooltipStyle}
          className={`
            bg-surface text-text rounded-lg shadow-xl border border-border
            ${sizeClasses[size]}
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            transition-all duration-200 ease-out
          `}
        >
          {persistent && (
            <button
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-surface hover:bg-bg/20 rounded-full flex items-center justify-center transition-colors border border-border"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          
          <div className="relative leading-relaxed">
            {typeof content === 'string' ? (
              <p>{content}</p>
            ) : (
              content
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Pre-configured tooltip variants for common use cases
export function InfoTooltip({ content, children, ...props }) {
  return (
    <Tooltip content={content} showIcon={true} {...props}>
      {children}
    </Tooltip>
  );
}

export function HelpTooltip({ content, ...props }) {
  return (
    <Tooltip 
      content={content} 
      trigger="click" 
      persistent={true}
      size="lg"
      {...props}
    >
      <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 transition-colors">
        <HelpCircle className="w-3 h-3" />
      </button>
    </Tooltip>
  );
}

// Feature callout tooltip for highlighting new features
export function FeatureTooltip({ title, description, children, ...props }) {
  const content = (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span className="font-semibold text-blue-200">{title}</span>
      </div>
      <p className="text-gray-200">{description}</p>
    </div>
  );

  return (
    <Tooltip 
      content={content}
      size="lg"
      className="relative"
      {...props}
    >
      <div className="relative">
        {children}
        {/* New feature indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      </div>
    </Tooltip>
  );
}
