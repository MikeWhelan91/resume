import React, { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Download, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import SeoHead from '../../components/SeoHead';

export default function Troubleshooting() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqItems = [
    {
      id: 'download-issues',
      category: 'Download Issues',
      question: 'My resume won\'t download or the download button isn\'t working',
      answer: (
        <div className="space-y-3">
          <p>Try these solutions in order:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check if your browser is blocking pop-ups or downloads</li>
            <li>Try a different browser (Chrome, Firefox, Safari, or Edge)</li>
            <li>Clear your browser cache and cookies</li>
            <li>Disable browser extensions temporarily</li>
            <li>Try downloading in an incognito/private browsing window</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400">If the issue persists, contact support with your browser and device information.</p>
        </div>
      )
    },
    {
      id: 'pdf-formatting',
      category: 'Formatting Issues',
      question: 'The PDF looks different from the preview or has formatting issues',
      answer: (
        <div className="space-y-3">
          <p>PDF rendering can sometimes differ from the web preview:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Font issues:</strong> Some fonts may not render correctly in PDF</li>
            <li><strong>Spacing:</strong> Line breaks and margins might appear different</li>
            <li><strong>Colors:</strong> Colors may look slightly different when printed</li>
          </ul>
          <p className="font-medium">Solutions:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Try the DOCX format for more consistent formatting</li>
            <li>Use a different template if formatting issues persist</li>
            <li>Check the preview before downloading</li>
          </ul>
        </div>
      )
    },
    {
      id: 'account-access',
      category: 'Account Issues',
      question: 'I can\'t log in to my account or forgot my password',
      answer: (
        <div className="space-y-3">
          <p>For login issues:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Use the "Forgot Password" link on the login page</li>
            <li>Check your email (including spam folder) for reset instructions</li>
            <li>Make sure you're using the correct email address</li>
            <li>Try clearing browser cookies and cache</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400">Still having trouble? Contact support with your registered email address.</p>
        </div>
      )
    },
    {
      id: 'payment-issues',
      category: 'Billing & Payments',
      question: 'I paid for premium but still can\'t access premium features',
      answer: (
        <div className="space-y-3">
          <p>If you've completed payment but don't have access:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Log out and log back in to refresh your account status</li>
            <li>Check that you're logged into the correct account</li>
            <li>Wait a few minutes - sometimes activation takes time</li>
            <li>Check your email for payment confirmation</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400">If the issue persists after 15 minutes, contact support with your payment receipt.</p>
        </div>
      )
    },
    {
      id: 'template-not-loading',
      category: 'Technical Issues',
      question: 'Templates are not loading or the page is blank',
      answer: (
        <div className="space-y-3">
          <p>When templates don't load properly:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Refresh the page (Ctrl+R or Cmd+R)</li>
            <li>Check your internet connection</li>
            <li>Try a different browser</li>
            <li>Disable ad blockers or extensions</li>
            <li>Clear browser cache and cookies</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">If templates still won't load, try using a different device or contact support.</p>
        </div>
      )
    },
    {
      id: 'content-not-saving',
      category: 'Technical Issues',
      question: 'My resume content isn\'t saving or keeps disappearing',
      answer: (
        <div className="space-y-3">
          <p>To prevent losing your work:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Make sure you're logged in to save progress</li>
            <li>Don't use browser back/forward buttons during editing</li>
            <li>Save frequently using the save button</li>
            <li>Avoid having multiple tabs open with the same resume</li>
            <li>Don't leave the page idle for too long</li>
          </ul>
          <p className="text-sm font-medium text-blue-600">Pro tip: Copy important content to a text document as backup while editing.</p>
        </div>
      )
    },
    {
      id: 'slow-generation',
      category: 'Performance',
      question: 'Resume generation is taking too long or timing out',
      answer: (
        <div className="space-y-3">
          <p>If resume generation is slow:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Wait patiently - complex resumes can take 30-60 seconds</li>
            <li>Don't refresh the page or click multiple times</li>
            <li>Try generating during off-peak hours</li>
            <li>Reduce the amount of content if very lengthy</li>
            <li>Check your internet connection speed</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">If generation consistently fails, contact support.</p>
        </div>
      )
    },
    {
      id: 'mobile-issues',
      category: 'Mobile & Device',
      question: 'The website doesn\'t work well on my phone or tablet',
      answer: (
        <div className="space-y-3">
          <p>For the best experience on mobile devices:</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Use the latest version of your mobile browser</li>
            <li>Try rotating to landscape mode for editing</li>
            <li>Use a desktop computer for complex editing tasks</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Close other apps to free up memory</li>
          </ul>
          <p className="text-sm text-blue-600">Note: Desktop computers provide the best experience for resume creation.</p>
        </div>
      )
    }
  ];

  const filteredItems = faqItems.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SeoHead
        title="Troubleshooting Guide – TailoredCV.app"
        description="Find solutions to common issues with TailoredCV.app. Troubleshooting guide for download problems, formatting issues, and technical support."
        canonical="https://tailoredcv.app/help/troubleshooting"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/support" className="inline-flex items-center space-x-2 text-blue-100 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Support</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Troubleshooting Guide
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              Find quick solutions to common issues and get back to creating amazing resumes.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-surface text-text border border-border rounded-2xl shadow-lg p-8">
            
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search for solutions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border bg-surface text-text rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-accent"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-text mb-4">Quick Fixes</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-border rounded-lg p-4 hover:border-blue-300 transition-colors bg-surface text-text">
                  <div className="flex items-center space-x-3 mb-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-text">Download Issues</h3>
                  </div>
                  <p className="text-muted text-sm">Try a different browser or disable pop-up blockers.</p>
                </div>
                <div className="border border-border rounded-lg p-4 hover:border-purple-300 transition-colors bg-surface text-text">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-text">Formatting Problems</h3>
                  </div>
                  <p className="text-muted text-sm">Use DOCX format or try a different template.</p>
                </div>
                <div className="border border-border rounded-lg p-4 hover:border-teal-300 transition-colors bg-surface text-text">
                  <div className="flex items-center space-x-3 mb-2">
                    <Zap className="w-5 h-5 text-teal-600" />
                    <h3 className="font-medium text-text">Slow Performance</h3>
                  </div>
                  <p className="text-muted text-sm">Clear browser cache and close other tabs.</p>
                </div>
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-text mb-4">Common Issues & Solutions</h2>
              
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No results found. Try a different search term or browse all issues below.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} className="border border-border bg-surface text-text rounded-lg">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full mt-1">
                          {item.category}
                        </span>
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.question}</h3>
                      </div>
                      {expandedItems[item.id] ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedItems[item.id] && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        <div className="pt-4 text-gray-700 dark:text-gray-300">
                          {item.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Still Need Help */}
            <div className="mt-12 bg-blue-50 rounded-xl p-6">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Still Need Help?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Can't find the solution you're looking for? Our support team is here to help.
                </p>
                <div className="space-x-4">
                  <Link href="/support" className="inline-flex items-center space-x-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">
                    <span>Contact Support</span>
                  </Link>
                  <Link href="/help/getting-started" className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white font-medium">
                    <span>Getting Started Guide</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
