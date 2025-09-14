import { Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';

export default function Footer() {
  const { toggleLanguage, getLanguageDisplay, getTerminology } = useLanguage();
  const terms = getTerminology();
  return (
    <footer className="border-t border-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient dark:text-white">TailoredCV.app</span>
            </div>
            <p className="text-sm text-muted max-w-xs">
              AI-powered {terms.resume} and cover letter optimization that gets you hired faster.
            </p>
          </div>

          {/* Links */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-text mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-sm text-muted hover:text-text transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-muted hover:text-text transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <Link href="/support" className="text-sm text-muted hover:text-text transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-text mb-4">Settings</h3>
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div>
                <label className="text-xs font-medium text-muted block mb-2">Theme</label>
                <ThemeToggle />
              </div>
              
              {/* Language Toggle */}
              <div>
                <label className="text-xs font-medium text-muted block mb-2">Language</label>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-bg transition-colors"
                  title={`Switch to ${getLanguageDisplay() === 'US English' ? 'UK English' : 'US English'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{getLanguageDisplay()}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/70">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0">
            <p className="text-xs text-muted">
              © {new Date().getFullYear()} TailoredCV.app. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
