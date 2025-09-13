import { Sparkles, Heart, Globe } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';

export default function Footer() {
  const { toggleLanguage, getLanguageDisplay } = useLanguage();
  return (
    <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient dark:text-white">TailoredCV.app</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
              AI-powered resume and cover letter optimization that gets you hired faster.
            </p>
          </div>

          {/* Links */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">Theme</label>
                <ThemeToggle />
              </div>
              
              {/* Language Toggle */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">Language</label>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
        <div className="mt-8 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} TailoredCV.app. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current" />
              <span>for job seekers worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}