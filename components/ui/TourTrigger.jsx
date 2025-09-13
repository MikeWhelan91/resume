import { useState } from 'react';
import { HelpCircle, Play } from 'lucide-react';

export default function TourTrigger({ onStartTour }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleStartTour = () => {
    // Clear the tour completion flag to restart it
    localStorage.removeItem('hero_onboarding_completed');
    if (onStartTour) {
      onStartTour();
    }
    // Dispatch custom event for the tour component
    window.dispatchEvent(new CustomEvent('startOnboardingTour'));
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={handleStartTour}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        title="Take a tour"
      >
        <Play className="w-5 h-5" />
        
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
            Take a tour
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </button>
    </div>
  );
}