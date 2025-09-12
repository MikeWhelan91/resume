import React from 'react';
import Head from 'next/head';
import { ArrowLeft, Briefcase, Palette, Users, Code, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TemplateGuidelines() {
  return (
    <>
      <Head>
        <title>Template Guidelines – TailoredCV.app</title>
        <meta name="description" content="Learn how to choose the right resume template for your industry and career level. Professional template guidelines and best practices." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/support" className="inline-flex items-center space-x-2 text-blue-100 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Support</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Template Guidelines
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              Choose the perfect template for your industry and make the best first impression.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            
            {/* Template Categories */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Template Categories</h2>
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Professional Templates */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Professional Templates</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Clean, traditional layouts perfect for corporate environments.</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Finance & Banking</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Legal & Law</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Consulting</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Healthcare Management</span>
                    </div>
                  </div>
                </div>

                {/* Creative Templates */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Palette className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Creative Templates</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Modern, visually appealing designs for creative industries.</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Graphic Design</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Marketing & Advertising</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Media & Entertainment</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Architecture</span>
                    </div>
                  </div>
                </div>

                {/* Tech Templates */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Code className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tech Templates</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Modern layouts optimized for technical roles and startups.</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Software Development</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Data Science</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Product Management</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">DevOps & Engineering</span>
                    </div>
                  </div>
                </div>

                {/* Academic Templates */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Academic Templates</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Formal layouts for educational and research positions.</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Teaching Positions</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Research Roles</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">PhD Applications</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Grant Applications</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Choosing Guidelines */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Choose the Right Template</h2>
              <div className="space-y-6">
                
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Consider Your Industry</h3>
                  <p className="text-gray-700">Conservative industries (finance, law, healthcare) prefer traditional layouts, while creative fields allow for more visual flair.</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Match Your Experience Level</h3>
                  <p className="text-gray-700">Entry-level candidates can use templates that highlight education and skills, while experienced professionals should emphasize work history.</p>
                </div>

                <div className="border-l-4 border-teal-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Consider the Company Culture</h3>
                  <p className="text-gray-700">Research the company's culture. Startups and creative agencies often appreciate modern designs, while corporations prefer conservative layouts.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Think About ATS Compatibility</h3>
                  <p className="text-gray-700">Many companies use Applicant Tracking Systems. Our templates are ATS-friendly, but simpler layouts often work better for automated screening.</p>
                </div>

              </div>
            </div>

            {/* Do's and Don'ts */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Template Best Practices</h2>
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Do's */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Do's</span>
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Choose templates that enhance readability</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Match the template to your target role</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Use consistent fonts and spacing</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Ensure important information stands out</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Test different templates to see what works</span>
                    </li>
                  </ul>
                </div>

                {/* Don'ts */}
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Don'ts</span>
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Don't use overly flashy designs for conservative roles</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Don't sacrifice readability for visual appeal</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Don't use templates with too much white space</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Don't choose templates that don't fit your content</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Don't use the same template for every application</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Choose Your Template?</h3>
              <div className="space-x-4">
                <Link href="/wizard" className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                  <span>Start Creating</span>
                </Link>
                <Link href="/help/troubleshooting" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium">
                  <span>Troubleshooting Guide</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}