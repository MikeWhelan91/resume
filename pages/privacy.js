import React from 'react';
import Link from 'next/link';
import { Shield, User, Lock, Eye } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function PrivacyPolicy() {
  return (
    <>
      <SeoHead
        title="Privacy Policy - TailoredCV.app"
        description="Learn how TailoredCV.app collects, uses, and protects your personal information and resume data."
        canonical="https://tailoredcv.app/privacy"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                TailoredCV.app ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume and cover letter generation service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-6 h-6" />
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name and contact information (email address)</li>
                <li>Account credentials and authentication data</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Resume and career information you provide</li>
                <li>Job descriptions you input for tailoring</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information and operating system</li>
                <li>Usage patterns and feature interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                3. How We Use Your Information
              </h2>
              
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide and improve our resume generation services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Personalize your experience and generate tailored content</li>
                <li>Communicate with you about your account and our services</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                4. Data Security
              </h2>
              
              <p className="text-gray-700 mb-4">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Secure cloud hosting with enterprise-grade security</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication protocols</li>
                <li>Payment processing through PCI-compliant Stripe</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Information Sharing</h2>
              
              <p className="text-gray-700 mb-4">We do not sell your personal information. We may share your information only in these circumstances:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> Third-party services that help us operate (OpenAI for content generation, Stripe for payments)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Download your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain data processing activities</li>
              </ul>
              
              <p className="text-gray-700 mt-4">
                To exercise these rights, contact us at <a href="mailto:support@tailoredcv.app" className="text-blue-600 hover:underline">support@tailoredcv.app</a>.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              
              <p className="text-gray-700">
                We retain your information for as long as your account is active or as needed to provide services. 
                When you delete your account, we will delete your personal information within 30 days, except where 
                retention is required for legal compliance, dispute resolution, or enforcement of agreements.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Transfers</h2>
              
              <p className="text-gray-700">
                Your information may be processed in countries other than your own. We ensure appropriate safeguards 
                are in place to protect your information in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking</h2>
              
              <p className="text-gray-700 mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Provide secure access to your account</li>
                <li>Analyze site usage and performance</li>
                <li>Improve user experience</li>
              </ul>
              
              <p className="text-gray-700 mt-4">
                You can control cookies through your browser settings, but disabling cookies may affect functionality.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
              
              <p className="text-gray-700">
                Our service is not intended for individuals under 16 years of age. We do not knowingly collect 
                personal information from children under 16. If you become aware that a child has provided us with 
                personal information, please contact us immediately.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
              
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new policy on this page and updating the "Last updated" date. Your continued use 
                of our service after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              
              <p className="text-gray-700">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">TailoredCV.app</p>
                <p className="text-gray-700">Email: <a href="mailto:support@tailoredcv.app" className="text-blue-600 hover:underline">support@tailoredcv.app</a></p>
                <p className="text-gray-700">Support: <Link href="/support" className="text-blue-600 hover:underline">Contact Support</Link></p>
              </div>
            </section>

            {/* Navigation */}
            <div className="border-t border-gray-200 pt-8 flex justify-between items-center">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to Home
              </Link>
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}