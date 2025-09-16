import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Calculate scroll threshold based on viewport height
      // Mobile: 40% of viewport height, Desktop: 300px minimum
      const viewportHeight = window.innerHeight;
      const isMobile = window.innerWidth < 768;
      const scrollThreshold = isMobile
        ? Math.max(viewportHeight * 0.4, 200) // 40% of screen height, minimum 200px
        : 300; // Desktop: 300px as before

      if (window.pageYOffset > scrollThreshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Throttle scroll events for performance
    let timeoutId = null;
    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(toggleVisibility, 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-600 text-white hover:text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl group"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5 group-hover:animate-bounce" />
        </button>
      )}
    </>
  );
}