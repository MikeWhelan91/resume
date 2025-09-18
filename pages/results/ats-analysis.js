import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Download, RefreshCw, Target, TrendingUp, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

import ResultsLayout from '../../components/results/ResultsLayout';
import ResumePreview from '../../components/results/ResumePreview';
import DownloadSection from '../../components/results/DownloadSection';
import ATSAnalysisCard from '../../components/results/ATSAnalysisCard';
import ResumeTemplate from '../../components/ResumeTemplate';
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

        // Look for analysis data in different possible locations
        const analysis = parsedData.atsAnalysis || parsedData.analysis || parsedData.resumeData.atsAnalysis;
        if (analysis) {
          setAtsAnalysis(analysis);
        }

        console.log('🔍 ATS Results Debug - Full parsedData:', JSON.stringify(parsedData, null, 2));
        console.log('🔍 ATS Results Debug - Found analysis:', analysis ? 'Yes' : 'No');
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
      <div className="space-y-6">
        {/* Compact Hero Section */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">CV Health Check Complete</h2>
          <p className="text-gray-600 text-sm">
            We've analyzed your CV for ATS compatibility and identified improvement opportunities.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Analysis + Preview */}
          <div className="xl:col-span-2 space-y-6">
            {/* Analysis Results - Compact */}
            {atsAnalysis ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Analysis Header with Score */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">ATS Compatibility Score</h3>
                        <p className="text-sm text-gray-600">Overall assessment of your CV</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        // Calculate correct average from category scores
                        const categoryScores = Object.values(atsAnalysis.categories).map(cat => cat.score);
                        const correctAverage = Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length);

                        return (
                          <>
                            <div className="text-2xl font-bold text-gray-900">{correctAverage}/100</div>
                            <div className={`text-sm font-medium ${
                              correctAverage >= 80 ? 'text-green-600' :
                              correctAverage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {correctAverage >= 80 ? 'Excellent' :
                               correctAverage >= 60 ? 'Good' : 'Needs Work'}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* ATS Compatibility Metrics */}
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(atsAnalysis.categories).map(([key, data]) => {
                      // Handle both old and new metric names
                      const metricLabels = {
                        // New ATS-focused metrics
                        sectionHeaders: 'Section Headers',
                        contactInfo: 'Contact Info',
                        experienceStructure: 'Experience Format',
                        skillsOptimization: 'Skills Section',
                        // Legacy metrics (fallback)
                        keywordOptimization: 'Keywords',
                        contentRelevance: 'Content',
                        skillsAlignment: 'Skills',
                        completeness: 'Completeness'
                      };

                      const displayName = metricLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();

                      return (
                        <div key={key} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className={`text-lg font-bold mb-1 ${
                            data.score >= 80 ? 'text-green-600' :
                            data.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {data.score}
                          </div>
                          <div className="text-xs text-gray-700 font-medium">
                            {displayName}
                          </div>
                          <div className={`text-xs mt-1 font-medium ${
                            data.score >= 80 ? 'text-green-600' :
                            data.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {data.score >= 80 ? 'ATS Ready' :
                             data.score >= 60 ? 'Needs Work' : 'Fix Required'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Wins - Compact */}
                  {atsAnalysis.quickWins && atsAnalysis.quickWins.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Quick Wins ({atsAnalysis.quickWins.length})
                      </h4>
                      <div className="space-y-1">
                        {atsAnalysis.quickWins.slice(0, 3).map((win, index) => (
                          <div key={index} className="text-xs text-green-800 flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {win}
                          </div>
                        ))}
                        {atsAnalysis.quickWins.length > 3 && (
                          <div className="text-xs text-green-700 font-medium">
                            +{atsAnalysis.quickWins.length - 3} more recommendations
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Issues - Show All */}
                  {atsAnalysis.issues && atsAnalysis.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2 flex items-center text-sm">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Issues to Fix ({atsAnalysis.issues.length})
                      </h4>
                      <div className="space-y-1">
                        {atsAnalysis.issues.map((issue, index) => (
                          <div key={index} className="text-xs text-red-800 flex items-start">
                            <span className="text-red-500 mr-1">•</span>
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Analysis In Progress</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Your ATS analysis is being processed.
                </p>
                <button
                  onClick={handleReAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
                </button>
              </div>
            )}

            {/* CV Preview - Larger and Scrollable */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">Your CV (As Parsed by ATS)</h3>
                <p className="text-xs text-gray-500 mt-1">Scroll to view full document</p>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="bg-white shadow-lg rounded-lg overflow-auto mx-auto border border-gray-200"
                     style={{
                       aspectRatio: '210/297',
                       height: '700px',
                       maxWidth: '530px'
                     }}>
                  <div style={{
                    transform: 'scale(1.1)',
                    transformOrigin: 'top left',
                    width: '91%',
                    minHeight: '100%'
                  }}>
                    <ResumeTemplate
                      userData={userData}
                      accent="#6b7280"
                      template="ats"
                      userPlan={userPlan}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Download & Summary */}
          <div className="space-y-4">
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
              title="Download CV"
              description="Get your ATS-optimized CV"
              userPlan={userPlan}
            />

            {/* CV Parsing Summary - Compact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Parsing Results
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contact Info</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 font-medium">Complete</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Summary</span>
                  <div className="flex items-center space-x-1">
                    {userData.summary ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 font-medium">Found</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-700 font-medium">Missing</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Experience</span>
                  <div className="flex items-center space-x-1">
                    {userData.experience?.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 font-medium">{userData.experience.length} jobs</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-700 font-medium">None</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Skills</span>
                  <div className="flex items-center space-x-1">
                    {userData.skills?.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 font-medium">{userData.skills.length}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span className="text-red-700 font-medium">None</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Education</span>
                  <div className="flex items-center space-x-1">
                    {userData.education?.length > 0 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 font-medium">{userData.education.length}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-700 font-medium">Missing</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Next Steps */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Next Steps</h3>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Review analysis above</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Implement improvements</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Re-upload updated CV</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>Download optimized version</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ResultsLayout>
  );
}