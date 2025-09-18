import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Download, RefreshCw, Copy, Check, Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';
import ResultsLayout from '../../components/results/ResultsLayout';
import DownloadSection from '../../components/results/DownloadSection';

export default function CoverLetterResultsPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
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
    if (!resultData?.coverLetter) return;

    setDownloading(true);
    try {
      const endpoint = format === 'docx' ? '/api/export-cover-letter-docx' : '/api/export-cover-letter-pdf';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: resultData.coverLetter,
          resumeData: resultData.resumeData,
          template: resultData.template || 'classic'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter.${format}`;
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

  const handleCopyText = async () => {
    if (!resultData?.coverLetter) return;

    try {
      await navigator.clipboard.writeText(resultData.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy text. Please select and copy manually.');
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
      formData.append('userGoal', 'cover-letter');
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

  const CoverLetterPreview = ({ coverLetter, scale = 1.1 }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="bg-white p-8 mx-auto"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: '530px',
          minHeight: '700px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          lineHeight: '1.6'
        }}
      >
        <div
          className="prose prose-sm max-w-none"
          style={{
            whiteSpace: 'pre-line',
            color: '#333',
            fontSize: '11px',
            lineHeight: '1.6'
          }}
        >
          {coverLetter}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <ResultsLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ResultsLayout>
    );
  }

  if (!resultData || !resultData.coverLetter) {
    return (
      <ResultsLayout title="No Results">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No cover letter data found.</p>
          <button
            onClick={() => router.push('/wizard')}
            className="btn btn-primary"
          >
            Create New Cover Letter
          </button>
        </div>
      </ResultsLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Wizard', href: '/wizard' },
    { label: 'Cover Letter Results' }
  ];

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleCopyText}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        <span>{copied ? 'Copied!' : 'Copy Text'}</span>
      </button>
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm font-medium"
      >
        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
        <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
      </button>
    </div>
  );

  return (
    <ResultsLayout
      title="Cover Letter Generated"
      description="Your tailored cover letter is ready for download"
      breadcrumbs={breadcrumbs}
      headerActions={headerActions}
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - Cover Letter Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cover Letter Preview</h3>
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

          {/* Cover Letter Preview */}
          <CoverLetterPreview
            coverLetter={resultData.coverLetter}
            scale={previewScale}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Download Section */}
          <DownloadSection
            onDownload={handleDownload}
            isDownloading={downloading}
            title="Download Cover Letter"
            description="Get your professionally formatted cover letter"
          />

          {/* Cover Letter Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Word Count</span>
                <span className="font-medium">{resultData.coverLetter?.split(/\s+/).length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Character Count</span>
                <span className="font-medium">{resultData.coverLetter?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paragraphs</span>
                <span className="font-medium">{resultData.coverLetter?.split('\n\n').length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tone</span>
                <span className="font-medium capitalize">Professional</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/wizard')}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Create New Cover Letter</div>
                <div className="text-sm text-gray-600">Start fresh with new information</div>
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('userGoal', 'cv');
                  router.push('/wizard');
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Create Resume</div>
                <div className="text-sm text-gray-600">Generate matching resume</div>
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

          {/* Job Description Preview */}
          {resultData.jobDescription && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description Used</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {resultData.jobDescription.substring(0, 300)}
                  {resultData.jobDescription.length > 300 && '...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResultsLayout>
  );
}