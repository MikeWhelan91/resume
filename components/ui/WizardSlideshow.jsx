import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WizardSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      src: '/tailored/wizard1.png',
      alt: 'Step 1 - Upload your resume',
      title: 'Upload Your Resume',
      description: 'Start by uploading your existing resume'
    },
    {
      src: '/tailored/wizard2.png',
      alt: 'Step 2 - Paste job description',
      title: 'Paste Job Description',
      description: 'Add the job posting you want to apply for'
    },
    {
      src: '/tailored/wizard3.png',
      alt: 'Step 3 - Choose generation type',
      title: 'Choose Your Goal',
      description: 'Select CV, cover letter, or both'
    },
    {
      src: '/tailored/wizard4.png',
      alt: 'Step 4 - Set preferences',
      title: 'Set Preferences',
      description: 'Customize tone and language settings'
    },
    {
      src: '/tailored/wizard5.png',
      alt: 'Step 5 - AI processing',
      title: 'AI Processing',
      description: 'Our AI tailors your content to match the job'
    },
    {
      src: '/tailored/wizard6.png',
      alt: 'Step 6 - Download results',
      title: 'Download Results',
      description: 'Get your perfectly tailored resume and cover letter'
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto group">

      {/* Main slideshow container */}
      <div
        className="relative rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
        style={{
          width: '100%',
          height: '400px'
        }}
      >
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out"
            style={{
              opacity: index === currentSlide ? 1 : 0,
              transform: index === currentSlide
                ? 'translateX(0)'
                : index < currentSlide
                ? 'translateX(-100%)'
                : 'translateX(100%)'
            }}
          >
            {/* Fixed size image container */}
            <div
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                backgroundColor: '#f8f9fa'
              }}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                style={{
                  width: '320px',
                  height: '320px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onLoad={() => console.log(`✅ SLIDE IMAGE LOADED: ${slide.src}`)}
                onError={(e) => console.error(`❌ SLIDE IMAGE FAILED: ${slide.src}`, e)}
              />
            </div>
          </div>
        ))}

        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Step indicator */}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Slide indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-blue-600 scale-125'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Current slide info */}
      <div className="text-center mt-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          {slides[currentSlide].title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {slides[currentSlide].description}
        </p>
      </div>
    </div>
  );
}