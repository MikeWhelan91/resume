import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

function TooltipContent({ 
  content, 
  size, 
  persistent, 
  onClose, 
  style 
}) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-2 w-64',
    md: 'text-sm px-3 py-2 w-80', 
    lg: 'text-sm px-4 py-3 w-96',
    xl: 'text-base px-5 py-4 w-[28rem]'
  };

  return (
    <div
      style={style}
      className={`
        fixed z-[9999] bg-surface text-text rounded-lg shadow-xl border border-border
        ${sizeClasses[size]}
        opacity-100 scale-100 transition-all duration-200 ease-out
      `}
    >
      {persistent && (
        <button
          onClick={onClose}
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
  );
}

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
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);

  // Ensure component is mounted (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current && mounted) {
      updateTooltipPosition();
    }
  }, [isVisible, position, mounted]);

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
    const tooltipHeight = 120; // estimated height
    const gap = 16;

    let top, left;

    // Calculate position based on preference and available space
    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        
        // If no space above, position below
        if (top < 10) {
          top = rect.bottom + gap;
        }
        break;

      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        
        // If no space below, position above
        if (top + tooltipHeight > viewport.height - 10) {
          top = rect.top - tooltipHeight - gap;
        }
        break;

      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        
        if (left < 10) {
          left = rect.right + gap;
        }
        break;

      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        
        if (left + tooltipWidth > viewport.width - 10) {
          left = rect.left - tooltipWidth - gap;
        }
        break;

      default:
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(10, Math.min(left, viewport.width - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, viewport.height - tooltipHeight - 10));

    setTooltipStyle({ top, left });
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

  const handleClose = () => {
    setIsVisible(false);
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

      {/* Portal tooltip to document.body */}
      {mounted && isVisible && typeof document !== 'undefined' && createPortal(
        <TooltipContent
          content={content}
          size={size}
          persistent={persistent}
          onClose={handleClose}
          style={tooltipStyle}
        />,
        document.body
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
      <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors">
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
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        <span className="font-semibold text-accent">{title}</span>
      </div>
      <p className="text-muted">{description}</p>
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
