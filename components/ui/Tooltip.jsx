import { useState } from 'react';
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

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    'top-left': 'bottom-full right-0 mb-2',
    'top-right': 'bottom-full left-0 mb-2',
    'bottom-left': 'top-full right-0 mt-2',
    'bottom-right': 'top-full left-0 mt-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
    'top-left': 'top-full right-3 border-l-transparent border-r-transparent border-b-transparent',
    'top-right': 'top-full left-3 border-l-transparent border-r-transparent border-b-transparent',
    'bottom-left': 'bottom-full right-3 border-l-transparent border-r-transparent border-t-transparent',
    'bottom-right': 'bottom-full left-3 border-l-transparent border-r-transparent border-t-transparent'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 w-64',
    md: 'text-sm px-3 py-2 w-80',
    lg: 'text-sm px-4 py-3 w-96',
    xl: 'text-base px-5 py-4 w-[28rem]'
  };

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
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

  const tooltipContent = (
    <div 
      className={`
        absolute z-50 bg-surface text-text rounded-lg shadow-lg border border-border
        ${positionClasses[position]}
        ${sizeClasses[size]}
        ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}
        transition-all duration-200 ease-in-out
      `}
    >
      {/* Arrow */}
      <div 
        className={`
          absolute w-0 h-0 border-4 border-border
          ${arrowClasses[position]}
        `}
      />
      
      {/* Content */}
      <div className="relative">
        {persistent && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-1 -right-1 w-4 h-4 bg-surface hover:bg-bg/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
        {typeof content === 'string' ? (
          <p className="leading-relaxed">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="flex items-center cursor-help"
        onClick={handleTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        {showIcon && (
          <HelpCircle className="w-4 h-4 text-muted hover:text-text ml-1 transition-colors" />
        )}
      </div>
      {tooltipContent}
    </div>
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
