import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Book, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch('/api/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setSubmitMessage(data.message);
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          category: 'general'
        });
        setTimeout(() => {
          setIsSubmitted(false);
          setSubmitMessage('');
        }, 5000);
      } else {
        setSubmitError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Failed to send message. Please try again or email us directly at support@tailoredcv.app');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <SeoHead
        title="Support – TailoredCV.app"
        description="Get help with TailoredCV.app. Find answers to common questions or contact our support team for assistance with your resume and cover letter needs."
        canonical="https://tailoredcv.app/support"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                How can we help you?
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Get the support you need to create amazing resumes and cover letters. We're here to help you succeed.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-surface text-text border border-border rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-text">Contact Support</h2>
                </div>

                {isSubmitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800">{submitMessage || "Thank you! We'll get back to you within 24 hours."}</p>
                  </div>
                )}

                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">{submitError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-muted mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-border bg-surface text-text rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-accent transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-border bg-surface text-text rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-accent transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-muted mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-surface text-text rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-accent transition-colors"
                    >
                      <option value="general">General Support</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Account</option>
                      <option value="templates">Template Question</option>
                      <option value="export">Download/Export Issue</option>
                      <option value="feedback">Feedback & Suggestions</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-muted mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-surface text-text rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-accent transition-colors"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-muted mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-surface text-text rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-accent transition-colors resize-none"
                      placeholder="Please describe your issue or question in detail..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>

            {/* Support Info Sidebar */}
            <div className="space-y-6">
              
              {/* Contact Info */}
              <div className="bg-surface text-text border border-border rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-text">Email Support</p>
                      <a href="mailto:support@tailoredcv.app" className="text-blue-600 hover:text-blue-700 transition-colors">
                        support@tailoredcv.app
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-text">Response Time</p>
                      <p className="text-muted text-sm">Usually within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Help */}
              <div className="bg-surface text-text border border-border rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Quick Help</h3>
                <div className="space-y-3">
                  <Link href="/help/getting-started" className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <Book className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-muted">Getting Started Guide</span>
                  </Link>
                  <Link href="/help/templates" className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-muted">Template Guidelines</span>
                  </Link>
                  <Link href="/help/troubleshooting" className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-muted">Troubleshooting</span>
                  </Link>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="bg-surface text-text border border-border rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Common Questions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-text text-sm mb-1">How do I download my resume?</h4>
                    <p className="text-muted text-xs">Use the download buttons on the results page to get PDF or DOCX files.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-text text-sm mb-1">Can I edit my resume after generating?</h4>
                    <p className="text-muted text-xs">Yes, you can modify content and switch between different templates.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-text text-sm mb-1">Which template should I use?</h4>
                    <p className="text-muted text-xs">Choose based on your industry - Professional for corporate, Creative for design roles.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
