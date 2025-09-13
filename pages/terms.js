import React from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, Scale, CreditCard } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function TermsOfService() {
  return (
    <>
      <SeoHead
        title="Terms of Service - TailoredCV.app"
        description="Terms and conditions for using TailoredCV.app resume and cover letter generation service."
        canonical="https://tailoredcv.app/terms"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These terms govern your use of TailoredCV.app and describe your rights and responsibilities.
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
            
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using TailoredCV.app ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you may not use the Service. These Terms apply to all users, 
                including free and paid subscribers.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                TailoredCV.app is an AI-powered platform that helps users create professional resumes and cover letters. Our services include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>AI-generated resume and cover letter content</li>
                <li>Professional templates and formatting</li>
                <li>ATS (Applicant Tracking System) optimization</li>
                <li>PDF and DOCX download capabilities</li>
                <li>Job description tailoring features</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">To use certain features, you must create an account. You agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Use the Service only for lawful purposes</li>
              </ul>
            </section>

            {/* Subscription and Billing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                4. Subscription and Billing
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Plan</h3>
              <p className="text-gray-700 mb-4">
                Our free plan provides limited access with 10 credits per week. Credits reset every Monday at midnight Dublin time.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Paid Plans</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>Billing occurs at the beginning of each billing cycle</li>
                <li>Prices are subject to change with 30 days notice</li>
                <li>No refunds for partial months or unused features</li>
                <li>You may cancel your subscription at any time</li>
                <li>Access continues until the end of your billing period after cancellation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Processing</h3>
              <p className="text-gray-700">
                All payments are processed securely through Stripe. We do not store your payment information directly. 
                You authorize us to charge your payment method for all applicable fees.
              </p>
            </section>

            {/* User Content */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Content and Data</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of all content you provide, including personal information, work experience, 
                and other resume data. You grant us a limited license to process and use this content solely 
                to provide our services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Accuracy</h3>
              <p className="text-gray-700 mb-4">You are responsible for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Ensuring all information you provide is accurate and truthful</li>
                <li>Not providing false, misleading, or fraudulent information</li>
                <li>Reviewing and verifying AI-generated content before use</li>
                <li>Compliance with applicable laws regarding resume content</li>
              </ul>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                6. Prohibited Uses
              </h2>
              
              <p className="text-gray-700 mb-4">You may not use our Service to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Create false or fraudulent resumes or credentials</li>
                <li>Impersonate another person or entity</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to reverse engineer or compromise our systems</li>
                <li>Share account credentials with others</li>
                <li>Use automated systems to access our Service</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Upload malicious code or viruses</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              
              <p className="text-gray-700 mb-4">
                The Service, including its design, functionality, templates, and underlying technology, 
                is owned by TailoredCV.app and protected by intellectual property laws. You may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Copy, modify, or distribute our proprietary content</li>
                <li>Use our trademarks or branding without permission</li>
                <li>Create derivative works based on our Service</li>
                <li>Remove or alter copyright notices</li>
              </ul>
            </section>

            {/* AI and Content Generation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. AI-Generated Content</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  Important: AI-generated content should always be reviewed and verified before use.
                </p>
              </div>

              <p className="text-gray-700 mb-4">Regarding AI-generated content:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Content is generated based on information you provide</li>
                <li>AI may occasionally produce inaccurate or inappropriate content</li>
                <li>You are responsible for reviewing and editing all generated content</li>
                <li>We do not guarantee the accuracy of AI-generated content</li>
                <li>Final responsibility for resume content accuracy lies with you</li>
              </ul>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Availability</h2>
              
              <p className="text-gray-700">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                We may temporarily suspend service for maintenance, updates, or other operational reasons. 
                We are not liable for any downtime or service interruptions.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="w-6 h-6" />
                10. Disclaimers and Limitations
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-medium">
                  The Service is provided "as is" without warranties of any kind.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Disclaimer of Warranties</h3>
              <p className="text-gray-700 mb-4">We disclaim all warranties, including:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Guarantees of employment or job interview success</li>
                <li>Accuracy or completeness of AI-generated content</li>
                <li>Compatibility with all ATS systems</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
              <p className="text-gray-700">
                Our total liability to you for all damages shall not exceed the amount you paid us in the 
                12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.
              </p>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>{' '}
                to understand how we collect, use, and protect your information.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>
              
              <p className="text-gray-700 mb-4">Either party may terminate your account:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>By You:</strong> Cancel your subscription at any time through your account settings</li>
                <li><strong>By Us:</strong> For violation of these Terms, non-payment, or other legitimate reasons</li>
              </ul>
              
              <p className="text-gray-700 mt-4">
                Upon termination, your access to the Service will cease, and we may delete your account data 
                in accordance with our Privacy Policy.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              
              <p className="text-gray-700">
                We may update these Terms from time to time. Material changes will be communicated via email 
                or through the Service. Your continued use after changes become effective constitutes acceptance 
                of the revised Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
              
              <p className="text-gray-700">
                These Terms are governed by the laws of Ireland. Any disputes will be resolved in the courts 
                of Dublin, Ireland. If any provision is found unenforceable, the remainder of these Terms 
                will remain in effect.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              
              <p className="text-gray-700 mb-4">
                For questions about these Terms or our Service, please contact us:
              </p>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">TailoredCV.app</p>
                <p className="text-gray-700">Email: <a href="mailto:support@tailoredcv.app" className="text-blue-600 hover:underline">support@tailoredcv.app</a></p>
                <p className="text-gray-700">Support: <Link href="/support" className="text-blue-600 hover:underline">Contact Support</Link></p>
              </div>
            </section>

            {/* Navigation */}
            <div className="border-t border-gray-200 pt-8 flex justify-between items-center">
              <Link href="/privacy" className="text-blue-600 hover:underline">
                ← Privacy Policy
              </Link>
              <Link href="/" className="text-blue-600 hover:underline">
                Back to Home →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}