import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sparkles, FileText, Home } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-200"></div>
              </div>
              <span className="text-xl font-bold text-gradient">TailorCV</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`nav-link ${router.pathname === '/' ? 'active' : ''}`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link 
              href="/wizard" 
              className={`nav-link ${router.pathname === '/wizard' ? 'active' : ''}`}
            >
              <FileText className="w-4 h-4" />
              Create Resume
            </Link>
            {router.pathname === '/results' && (
              <Link 
                href="/results" 
                className="nav-link active"
              >
                <Sparkles className="w-4 h-4" />
                Results
              </Link>
            )}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link 
              href="/wizard" 
              className="btn btn-primary btn-sm"
            >
              <Sparkles className="w-4 h-4" />
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}