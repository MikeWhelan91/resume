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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 text-white">
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            
            {/* Quick Start Steps */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start (3 minutes)</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Enter Your Details</h3>
                  <p className="text-gray-600 text-sm">Fill in your personal information, work experience, and skills</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Choose Template</h3>
                  <p className="text-gray-600 text-sm">Select from our professionally designed templates</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-teal-600 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Download & Apply</h3>
                  <p className="text-gray-600 text-sm">Get your resume as PDF or DOCX and start applying</p>
                </div>
              </div>
            </div>

            {/* Detailed Steps */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Step 1: Start Creating</h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-gray-700">Click the "Create Resume" button on the homepage to begin the wizard.</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li>Fill in your personal information (name, email, phone, location)</li>
                    <li>Add your work experience starting with your most recent job</li>
                    <li>List your education and relevant skills</li>
                    <li>Include any certifications or achievements</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Step 2: Customize Content</h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-gray-700">Our AI will help optimize your content for the job you're targeting.</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li>Use action verbs to describe your achievements</li>
                    <li>Quantify your results with numbers and percentages</li>
                    <li>Tailor your skills to match the job description</li>
                    <li>Keep descriptions concise but impactful</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Step 3: Download & Use</h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-gray-700">Export your resume in the format you need.</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                    <li><strong>PDF:</strong> Best for most applications and ATS systems</li>
                    <li><strong>DOCX:</strong> Editable format for further customization</li>
                    <li>Test different templates to see what works best</li>
                    <li>Update your resume regularly as you gain experience</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Pro Tips</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">Keep your resume to 1-2 pages maximum</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">Use consistent formatting and spacing</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">Proofread carefully for typos and errors</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">Tailor your resume for each job application</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
              <div className="space-x-4">
                <Link href="/wizard" className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                  <span>Create Your Resume</span>
                </Link>
                <Link href="/help/templates" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium">
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