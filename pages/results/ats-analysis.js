import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Download, RefreshCw, Target, TrendingUp, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

import ResultsLayout from '../../components/results/ResultsLayout';
import ResumePreview from '../../components/results/ResumePreview';
import DownloadSection from '../../components/results/DownloadSection';
import ATSAnalysisCard from '../../components/results/ATSAnalysisCard';
import { useError } from '../../contexts/ErrorContext';

export default function ATSAnalysisResults() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showError, showSuccess } = useError();

  // State
  const [userData, setUserData] = useState(null);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [downloadingStates, setDownloadingStates] = useState({});
  const [downloadCooldowns, setDownloadCooldowns] = useState({});
  const [userPlan, setUserPlan] = useState('free');

  // Download rate limiting
  const DOWNLOAD_COOLDOWN_MS = 2000;

  const setDownloadCooldown = (downloadType) => {
    const now = Date.now();
    setDownloadCooldowns(prev => ({
      ...prev,
      [downloadType]: now + DOWNLOAD_COOLDOWN_MS
    }));
  };

  const getDownloadCooldownRemaining = (downloadType) => {
    const remaining = downloadCooldowns[downloadType] - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  const setDownloadingState = (downloadType, isDownloading) => {
    setDownloadingStates(prev => ({
      ...prev,
      [downloadType]: isDownloading
    }));
  };

  // Load data from localStorage or redirect
  useEffect(() => {
    try {
      const stored = localStorage.getItem('resumeResult');
      if (!stored) {
        router.push('/wizard');
        return;
      }

      const parsedData = JSON.parse(stored);

      // Check if this is ATS analysis data
      if (parsedData.analysisOnly && parsedData.resumeData) {
        setUserData(parsedData.resumeData);
        if (parsedData.atsAnalysis) {
          setAtsAnalysis(parsedData.atsAnalysis);
        }
      } else {
        // Redirect to appropriate results page based on data type
        router.push('/results');
        return;
      }
    } catch (error) {
      console.error('Error loading results data:', error);
      router.push('/wizard');
    }
  }, [router]);

  // Download handlers
  const handleDownload = async (format) => {
    if (!userData) return;

    setDownloadingState(format, true);
    setDownloadCooldown(format);

    try {
      const response = await fetch('/api/download-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: userData,
          template: 'ats',
          format: format,
          accent: '#6b7280'
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userData.name || 'resume'}_ats_optimized.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess(`${format.toUpperCase()} downloaded successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      showError(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setDownloadingState(format, false);
    }
  };

  // Re-analyze handler
  const handleReAnalyze = async () => {
    if (!userData || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ats-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: userData,
          jobDescription: ''
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAtsAnalysis(result.analysis);

      // Update localStorage
      const currentData = JSON.parse(localStorage.getItem('resumeResult') || '{}');
      currentData.atsAnalysis = result.analysis;
      localStorage.setItem('resumeResult', JSON.stringify(currentData));

      showSuccess('Analysis updated successfully!');
    } catch (error) {
      console.error('Re-analysis error:', error);
      showError('Failed to re-analyze CV. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!userData) {
    return (
      <ResultsLayout title="Loading..." description="Loading your ATS analysis...">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your CV health check...</p>
          </div>
        </div>
      </ResultsLayout>
    );
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleReAnalyze}
        disabled={isAnalyzing}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
        <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
      </button>
    </div>
  );

  return (
    <ResultsLayout
      title="CV Health Check Results"
      description="Your ATS compatibility analysis and optimization recommendations"
      breadcrumbs={[
        { label: 'Wizard', href: '/wizard' },
        { label: 'ATS Analysis' }
      ]}
      headerActions={headerActions}
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">CV Health Check Complete</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We've analyzed your CV for ATS compatibility and identified opportunities to improve your application success rate.
          </p>
        </div>

        {/* Analysis Results */}
        <ATSAnalysisCard analysis={atsAnalysis} />

        {/* CV Preview & Download */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CV Preview */}
          <div className="lg:col-span-2">
            <ResumePreview
              userData={userData}
              template="ats"
              accent="#6b7280"
              userPlan={userPlan}
              title="Your CV (As Parsed by ATS)"
              showTemplateSelector={false}
            />
          </div>

          {/* Download Section */}
          <div className="space-y-6">
            <DownloadSection
              onDownload={handleDownload}
              downloadingStates={downloadingStates}
              cooldowns={Object.fromEntries(
                Object.entries(downloadCooldowns).map(([key, value]) => [
                  key,
                  getDownloadCooldownRemaining(key)
                ])
              )}
              availableFormats={['pdf', 'docx']}
              title="Download Optimized CV"
              description="Download your CV with our ATS-friendly formatting"
              userPlan={userPlan}
            />

            {/* CV Parsing Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                CV Parsing Results
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contact Information</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Complete</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Professional Summary</span>
                  <div className="flex items-center space-x-1">
                    {userData.summary ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">Detected</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 font-medium">Missing</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Work Experience</span>
                  <div className="flex items-center space-x-1">
                    {userData.experience?.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">{userData.experience.length} positions</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 font-medium">Not detected</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Skills</span>
                  <div className="flex items-center space-x-1">
                    {userData.skills?.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">{userData.skills.length} skills</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-red-700 font-medium">Not detected</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Education</span>
                  <div className="flex items-center space-x-1">
                    {userData.education?.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">{userData.education.length} entries</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 font-medium">Missing</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Review the detailed analysis above</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Implement the recommended improvements</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Re-upload your updated CV for a new analysis</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>Download the optimized version when ready</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ResultsLayout>
  );
}