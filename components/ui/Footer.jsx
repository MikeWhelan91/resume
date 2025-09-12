import { Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">TailoredCV.app</span>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              AI-powered resume and cover letter optimization that gets you hired faster.
            </p>
          </div>

          {/* Links */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Get Started</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your professional resume in minutes with AI-powered optimization.
            </p>
            <Link href="/wizard" className="btn btn-primary btn-sm inline-flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Start Building</span>
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} TailoredCV.app. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
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