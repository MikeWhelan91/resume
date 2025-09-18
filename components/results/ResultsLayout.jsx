import React from 'react';
import { ArrowLeft, Home, User, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import SeoHead from '../SeoHead';

export default function ResultsLayout({
  children,
  title = "Results",
  description = "Your generated resume and documents",
  breadcrumbs = [],
  headerActions = null,
  showBackButton = true
}) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <SeoHead
        title={`${title} – TailoredCV.app`}
        description={description}
        robots="noindex,nofollow"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Side */}
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}

                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-500 hover:text-gray-700 transition-colors flex items-center"
                  >
                    <Home className="w-4 h-4" />
                  </button>

                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      <span className="text-gray-400">/</span>
                      {crumb.href ? (
                        <button
                          onClick={() => router.push(crumb.href)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-gray-900 font-medium">{crumb.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              {/* Page Title */}
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-3">
                {headerActions}

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <User className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                © 2025 TailoredCV.app. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  Privacy Policy
                </button>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  Terms of Service
                </button>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  Support
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}