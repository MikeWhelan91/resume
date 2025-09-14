import React from 'react';
import { ArrowLeft, Play, Download, Edit, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import SeoHead from '../../components/SeoHead';

export default function GettingStarted() {
  return (
    <>
      <SeoHead
        title="Getting Started Guide – TailoredCV.app"
        description="Learn how to create your first resume with TailoredCV.app. Step-by-step guide to get you started quickly."
        canonical="https://tailoredcv.app/help/getting-started"
      />

      <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/support" className="inline-flex items-center space-x-2 text-blue-100 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Support</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Getting Started Guide
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              Learn how to create your first professional resume in just a few simple steps.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-surface text-text border border-border rounded-2xl shadow-lg p-8">
            
            {/* Quick Start Steps */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-text mb-6">Quick Start (3 minutes)</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-text mb-2">Enter Your Details</h3>
                  <p className="text-muted text-sm">Fill in your personal information, work experience, and skills</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-text mb-2">Choose Template</h3>
                  <p className="text-muted text-sm">Select from our professionally designed templates</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-teal-600 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-text mb-2">Download & Apply</h3>
                  <p className="text-muted text-sm">Get your resume as PDF or DOCX and start applying</p>
                </div>
              </div>
            </div>

            {/* Detailed Steps */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-text">Step 1: Start Creating</h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-text">Click the \"Create Resume\" button on the homepage to begin the wizard.</p>
                  <ul className="list-disc list-inside text-muted space-y-1 text-sm">
                    <li>Fill in your personal information (name, email, phone, location)</li>
                    <li>Add your work experience starting with your most recent job</li>
                    <li>List your education and relevant skills</li>
                    <li>Include any certifications or achievements</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-text">Step 2: Customize Content</h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-text">Our AI will help optimize your content for the job you're targeting.</p>
                  <ul className="list-disc list-inside text-muted space-y-1 text-sm">
                    <li>Use action verbs to describe your achievements</li>
                    <li>Quantify your results with numbers and percentages</li>
                    <li>Tailor your skills to match the job description</li>
                    <li>Keep descriptions concise but impactful</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-text">Step 3: Download & Use</h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-text">Export your resume in the format you need.</p>
                  <ul className="list-disc list-inside text-muted space-y-1 text-sm">
                    <li><strong>PDF:</strong> Best for most applications and ATS systems</li>
                    <li><strong>DOCX:</strong> Editable format for further customization</li>
                    <li>Test different templates to see what works best</li>
                    <li>Update your resume regularly as you gain experience</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="mt-12 bg-blue-50 dark:bg-gray-800/60 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-text">Pro Tips</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-muted text-sm">Keep your resume to 1-2 pages maximum</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-muted text-sm">Use consistent formatting and spacing</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-muted text-sm">Proofread carefully for typos and errors</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-muted text-sm">Tailor your resume for each job application</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold text-text mb-4">Ready to Get Started?</h3>
              <div className="space-x-4">
                <Link href="/wizard" className="inline-flex items-center space-x-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">
                  <span>Create Your Resume</span>
                </Link>
                <Link href="/help/templates" className="inline-flex items-center space-x-2 text-muted hover:text-text font-medium">
                  <span>Learn About Templates</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
