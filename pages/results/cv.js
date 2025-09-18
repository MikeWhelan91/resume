import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Download, RefreshCw, Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';
import ResultsLayout from '../../components/results/ResultsLayout';
import ResumePreview from '../../components/results/ResumePreview';
import DownloadSection from '../../components/results/DownloadSection';

export default function CVResultsPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1.1);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    // Load result data from localStorage
    const loadResultData = () => {
      try {
        const stored = localStorage.getItem('resumeResult');
        if (stored) {
          const data = JSON.parse(stored);
          setResultData(data);
        } else {
          // No result data - redirect to wizard
          router.push('/wizard');
          return;
        }
      } catch (error) {
        console.error('Error loading result data:', error);
        router.push('/wizard');
        return;
      }
      setLoading(false);
    };

    loadResultData();
  }, [router]);

  const handleDownload = async (format = 'pdf') => {
    if (!resultData?.resumeData) return;

    setDownloading(true);
    try {
      const endpoint = format === 'docx' ? '/api/export-resume-docx' : '/api/export-resume-pdf';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: resultData.resumeData,
          template: resultData.template || 'classic'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!resultData) return;

    setIsRegenerating(true);
    try {
      const jobDescription = localStorage.getItem('jobDescription') || '';

      const formData = new FormData();
      formData.append('resumeData', JSON.stringify(resultData.resumeData));
      formData.append('jobDesc', jobDescription);
      formData.append('tone', 'professional');
      formData.append('userGoal', 'cv');
      formData.append('language', 'en');

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });

      const newResult = await response.json();

      if (response.ok) {
        const updatedData = { ...newResult, jobDescription };
        localStorage.setItem('resumeResult', JSON.stringify(updatedData));
        setResultData(updatedData);
      } else {
        throw new Error(newResult.error || 'Regeneration failed');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Regeneration failed. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <ResultsLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ResultsLayout>
    );
  }

  if (!resultData) {
    return (
      <ResultsLayout title="No Results">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No resume data found.</p>
          <button
            onClick={() => router.push('/wizard')}
            className="btn btn-primary"
          >
            Create New Resume
          </button>
        </div>
      </ResultsLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Wizard', href: '/wizard' },
    { label: 'Resume Results' }
  ];

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
      >
        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
        <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
      </button>
    </div>
  );

  return (
    <ResultsLayout
      title="Resume Generated"
      description="Your tailored resume is ready for download"
      breadcrumbs={breadcrumbs}
      headerActions={headerActions}
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - Resume Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Resume Preview</h3>
              <div className="flex items-center space-x-3">
                {/* Scale Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewScale(s => Math.max(0.5, s - 0.1))}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom Out"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                    {Math.round(previewScale * 100)}%
                  </span>
                  <button
                    onClick={() => setPreviewScale(s => Math.min(2, s + 0.1))}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom In"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPreviewScale(1.1)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Device Preview Icons */}
                <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
                  <button
                    onClick={() => setPreviewScale(0.7)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Mobile View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewScale(0.9)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Tablet View"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewScale(1.1)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Desktop View"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Preview */}
          <ResumePreview
            resumeData={resultData.resumeData}
            template={resultData.template || 'classic'}
            scale={previewScale}
            height="700px"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Download Section */}
          <DownloadSection
            onDownload={handleDownload}
            isDownloading={downloading}
            title="Download Resume"
            description="Get your professionally formatted resume"
          />

          {/* Resume Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Entries</span>
                <span className="font-medium">{resultData.resumeData?.experience?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skills Listed</span>
                <span className="font-medium">{resultData.resumeData?.skills?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Education Entries</span>
                <span className="font-medium">{resultData.resumeData?.education?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projects</span>
                <span className="font-medium">{resultData.resumeData?.projects?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/wizard')}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Create New Resume</div>
                <div className="text-sm text-gray-600">Start fresh with new information</div>
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('userGoal', 'cover-letter');
                  router.push('/wizard');
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Create Cover Letter</div>
                <div className="text-sm text-gray-600">Generate matching cover letter</div>
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('userGoal', 'ats');
                  router.push('/wizard');
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <div className="font-medium text-gray-900">ATS Analysis</div>
                <div className="text-sm text-gray-600">Check ATS compatibility</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ResultsLayout>
  );
}