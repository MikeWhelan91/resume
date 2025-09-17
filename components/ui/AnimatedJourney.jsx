import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Upload, FileText, Settings, Sparkles, Download, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useError } from '../../contexts/ErrorContext';
import { useCreditContext } from '../../contexts/CreditContext';

export default function AnimatedJourney() {
  const containerRef = useRef(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showError } = useError();
  const { creditStatus } = useCreditContext();
  const [authCheck, setAuthCheck] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Check auth status for access control
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth-check');
        const data = await response.json();
        setAuthCheck(data);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthCheck({ authenticated: false, canAccess: false, reason: 'Unable to verify access' });
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [session]);

  const canGenerate = () => {
    if (authCheck) {
      return authCheck.canAccess;
    }

    // Fallback logic
    if (session?.user) return true;
    return false;
  };

  const showCreditModal = () => {
    const creditsRemaining = creditStatus?.credits?.total || 0;

    const modalContent = `
      <div class="text-center p-6">
        <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Credits Remaining</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">You have ${creditsRemaining} credits left. You need credits to create tailored resumes and cover letters.</p>
        <div class="space-y-3">
          <button onclick="window.location.href='/pricing'" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Buy More Credits
          </button>
          <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
        ${modalContent}
      </div>
    `;

    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  };

  const handleCreateNew = () => {
    // Check if user can generate new resumes
    if (!canGenerate()) {
      if (authCheck) {
        if (authCheck.authenticated) {
          // Check if it's a credit issue (same logic as navbar)
          if (creditStatus && creditStatus.needsCredits) {
            showCreditModal();
          } else {
            showError(authCheck.reason || 'You do not have access to create new resumes. Please upgrade your plan.', 'Access Denied');
          }
        } else {
          showError(authCheck.reason || 'You have used all your free trials. Please sign up to create unlimited resumes!', 'Trial Limit Reached');
        }
      } else {
        // Fallback message
        showError('You cannot create new resumes at this time. Please try again later.', 'Access Denied');
      }
      return;
    }

    // Go to wizard entry screen where user can choose their path
    router.push('/wizard');
  };

  const steps = [
    {
      id: 1,
      title: "Upload Your Resume",
      description: "Start by uploading your existing resume in PDF, DOCX, or TXT format. Our AI will extract all your information automatically.",
      image: "/tailored/wizard1.png",
      icon: Upload,
      color: "blue"
    },
    {
      id: 2,
      title: "Choose Your Path",
      description: "Choose what document you would like to create based on a job description.",
      image: "/tailored/wizard2.png",
      icon: FileText,
      color: "green"
    },
    {
      id: 3,
      title: "Paste Job Description",
      description: "Copy and paste the job posting you want to apply for. The more detailed, the better the AI can tailor your application.",
      image: "/tailored/wizard3.png",
      icon: Settings,
      color: "purple"
    },
    {
      id: 4,
      title: "AI Processing",
      description: "Our advanced AI analyzes the job requirements and tailors your content to match perfectly, highlighting relevant skills and experience.",
      image: "/tailored/wizard5.png",
      icon: Sparkles,
      color: "orange"
    },
    {
      id: 5,
      title: "Job Match Analysis",
      description: "Receive a comprehensive analysis showing how well your profile matches the job requirements, along with your perfectly tailored documents ready for submission.",
      image: "/tailored/wizard6.png",
      icon: Download,
      color: "red"
    }
  ];

  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600"
  };

  return (
    <div ref={containerRef} className="py-20 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16 relative"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-5">
            <div className="w-96 h-96 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-full px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 mb-6 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simple 5-Step Process</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              From Upload to{' '}
              <span className="text-blue-600 dark:text-blue-400">
                Hired
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
            >
              Transform your job applications in minutes with our AI-powered platform.
              Follow these simple steps to create perfectly tailored resumes and cover letters.
            </motion.p>

            {/* Visual progress indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center justify-center space-x-3 mt-8"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                  className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                    i === 0 ? 'from-blue-500 to-blue-600' :
                    i === 1 ? 'from-green-500 to-green-600' :
                    i === 2 ? 'from-purple-500 to-purple-600' :
                    i === 3 ? 'from-orange-500 to-orange-600' :
                    'from-red-500 to-red-600'
                  } shadow-lg`}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-32">
          {steps.map((step, index) => (
            <StepSection
              key={step.id}
              step={step}
              index={index}
              colorMap={colorMap}
              isReversed={index % 2 !== 0}
            />
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center text-center mt-20"
        >
          <motion.button
            whileHover={!checkingAuth && status !== 'loading' ? { scale: 1.05 } : {}}
            whileTap={!checkingAuth && status !== 'loading' ? { scale: 0.95 } : {}}
            onClick={handleCreateNew}
            disabled={checkingAuth}
            className={`group relative overflow-hidden px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
              status === 'loading' || checkingAuth
                ? 'opacity-50 cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl'
            }`}
          >
            <div className="relative flex items-center space-x-2">
              <span>Start Creating Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-md"
          >
            Ready to transform your job applications? Let's get started!
          </motion.p>
        </motion.div>

      </div>
    </div>
  );
}

function StepSection({ step, index, colorMap, isReversed }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={`grid lg:grid-cols-2 gap-12 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}
    >
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isReversed ? 50 : -50 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`${isReversed ? 'lg:col-start-2' : ''}`}
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[step.color]} p-4 shadow-lg transform hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-full h-full text-white" />
          </div>
        </div>

        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {step.title}
        </h3>

        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          {step.description}
        </p>
      </motion.div>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, x: isReversed ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isReversed ? -50 : 50 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`${isReversed ? 'lg:col-start-1' : ''}`}
      >
        <div className="relative">
          {/* Decorative background */}
          <div className={`absolute -inset-4 bg-gradient-to-br ${colorMap[step.color]} opacity-20 rounded-3xl blur-xl`}></div>

          <motion.div
            whileHover={{ scale: 1.02, rotate: 1 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200/50 dark:border-gray-600/50"
          >
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${colorMap[step.color]}`}></div>
            <img
              src={step.image}
              alt={step.title}
              className="w-full h-auto object-contain p-4"
              style={{ maxHeight: '500px' }}
            />
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
}