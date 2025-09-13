import React, { useState } from 'react';
import SeoHead from '../components/SeoHead';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Check, Crown, Sparkles, ArrowRight, Zap } from 'lucide-react';

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState('');

 const handleUpgrade = async (planType) => {
  if (!session) {
    window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent('/pricing');
    return;
  }

  setLoading(planType);
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      credentials: 'same-origin',             // <- send NextAuth cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType })      // server picks price from planType
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to create checkout session');
    }

    const { url } = await res.json();
    window.location.href = url;
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Unable to process upgrade. Please try again.');
  } finally {
    setLoading('');
  }
};


  const plans = [
    {
      name: 'Free',
      description: 'Perfect for trying out TailoredCV',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '10 credits per week (resets Monday)',
        '10 PDF downloads per week',
        'Professional template only',
        'PDF downloads only',
        'Basic customization',
        'Resume + Cover Letter generation'
      ],
      limitations: [
        'Limited templates',
        'Weekly credit limit'
      ],
      buttonText: 'Get Started Free',
      buttonVariant: 'secondary',
      popular: false
    },
    {
      name: 'Day Pass',
      description: 'Perfect for urgent job applications',
      monthlyPrice: 2.99,
      annualPrice: 2.99,
      features: [
        '24-hour unlimited access',
        '30 generations per day',
        '100 PDF downloads per day',
        '100 DOCX downloads per day',
        'All premium templates',
        'All color themes',
        'Priority processing',
        'Full customization access'
      ],
      buttonText: 'Buy Day Pass',
      buttonVariant: 'primary',
      popular: false,
      planType: 'day_pass'
    },
    {
      name: 'Pro Monthly',
      description: 'Full access with monthly flexibility',
      monthlyPrice: 9.99,
      annualPrice: 9.99,
      features: [
        'Unlimited generations & downloads',
        'No credit limits or restrictions',
        'All premium templates',
        'DOCX + PDF downloads',
        'All color themes',
        'Priority support',
        'Advanced customization',
        'ATS optimization'
      ],
      buttonText: 'Start Pro Monthly',
      buttonVariant: 'primary',
      popular: false,
      planType: 'pro_monthly'
    },
    {
      name: 'Pro Annual',
      description: 'Best value with 12 months commitment',
      monthlyPrice: 5.75,
      annualPrice: 69,
      yearlyDiscount: '42% off',
      features: [
        'Unlimited generations & downloads',
        'No credit limits or restrictions',
        'All premium templates',
        'DOCX + PDF downloads',
        'All color themes',
        'Priority support',
        'Advanced customization',
        'ATS optimization',
        '42% savings vs monthly'
      ],
      buttonText: 'Start Pro Annual - €69/year',
      buttonVariant: 'primary',
      popular: true,
      planType: 'pro_annual'
    }
  ];

  return (
    <>
      <SeoHead
        title="Pricing - TailoredCV.app"
        description="Choose the perfect plan for your resume and cover letter needs. Start free or unlock premium features with Pro."
        canonical="https://tailoredcv.app/pricing"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gradient">TailoredCV Pricing</h1>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Choose the perfect plan to create professional, ATS-friendly resumes and cover letters
              </p>
              
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'border-blue-500 bg-white scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                      <Crown className="w-4 h-4 mr-2" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    {plan.monthlyPrice === 0 ? (
                      <div className="text-4xl font-bold text-gray-900">Free</div>
                    ) : plan.name === 'Day Pass' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-4xl font-bold text-gray-900">
                          €{plan.monthlyPrice}
                        </span>
                        <span className="text-gray-600">/24h</span>
                      </div>
                    ) : plan.name === 'Pro Annual' ? (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-4xl font-bold text-gray-900">
                            €{plan.annualPrice}
                          </span>
                          <span className="text-gray-600">/year</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          €{plan.monthlyPrice}/month equivalent
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-4xl font-bold text-gray-900">
                          €{plan.monthlyPrice}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (plan.monthlyPrice === 0) {
                      window.location.href = session ? '/wizard' : '/auth/signup';
                    } else {
                      handleUpgrade(plan.planType);
                    }
                  }}
                  disabled={loading === plan.planType}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    plan.buttonVariant === 'primary'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                  } ${loading === plan.planType ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.planType ? (
                    <div className="loading-spinner w-5 h-5"></div>
                  ) : (
                    <>
                      <span>{plan.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {plan.name === 'Free' && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    No credit card required
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Got questions? We've got answers.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What happens when I run out of credits?</h3>
                <p className="text-gray-600">
                  Free users get 10 credits per week that reset every Monday at midnight Dublin time. Each generation consumes 1 credit. Pro users have unlimited usage.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600">
                  Yes! You can cancel your subscription at any time. You'll retain access to Pro features until the end of your current billing period.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What's the difference between templates?</h3>
                <p className="text-gray-600">
                  Free users get access to our Professional template. Pro users unlock all premium templates including Modern, Creative, Minimal, Two Column, and Executive designs.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">How does the Day Pass work?</h3>
                <p className="text-gray-600">
                  The Day Pass gives you 24 hours of full Pro access starting from the moment of purchase. You get 30 generations, 100 PDF & DOCX downloads, all premium templates, and full customization features - perfect for urgent job applications.
                </p>
              </div>

            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to create your perfect resume?</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join thousands of professionals who've landed their dream jobs with TailoredCV
              </p>
              <Link 
                href={session ? '/wizard' : '/auth/signup'} 
                className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Zap className="w-5 h-5" />
                <span>Get Started Now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}