import { useState } from 'react';
import { Zap, Target, AlertCircle, CheckCircle, TrendingUp, FileSearch, Lightbulb, Crown, Lock } from 'lucide-react';

export default function ATSOptimizer({ resumeData, onOptimizationComplete, userPlan = 'free' }) {
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPremiumFeature = !['pro_monthly', 'pro_annual'].includes(userPlan);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description to analyze against');
      return;
    }

    if (!resumeData) {
      setError('No resume data available for analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ats-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          jobDescription
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setError(`ATS Analysis requires a Pro subscription. ${data.message}`);
        } else {
          setError(data.error || 'Analysis failed');
        }
        return;
      }

      setAnalysis(data.analysis);
      if (onOptimizationComplete) {
        onOptimizationComplete(data.analysis);
      }
    } catch (err) {
      console.error('ATS analysis error:', err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isPremiumFeature) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-text mb-2">ATS Optimization</h3>
          <p className="text-muted mb-6">
            Get detailed ATS compatibility analysis with keyword recommendations, formatting suggestions, and industry-specific insights.
          </p>
          
          <div className="space-y-3 text-left bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm">ATS compatibility scoring (0-100)</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileSearch className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Keyword gap analysis</span>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Industry-specific recommendations</span>
            </div>
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Quick wins for immediate improvement</span>
            </div>
          </div>
          
          <button
            onClick={() => window.location.href = '/pricing'}
            className="btn btn-primary btn-lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">ATS Optimization</h2>
        <p className="text-muted">
          Analyze your resume against a specific job description to maximize ATS compatibility
        </p>
      </div>

      {/* Job Description Input */}
      {!analysis && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here. The more detailed, the better the analysis..."
              className="w-full h-40 px-4 py-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted mt-1">
              Include requirements, responsibilities, and preferred qualifications for best results
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !jobDescription.trim()}
            className="w-full btn btn-primary btn-lg"
          >
            {loading ? (
              <>
                <div className="loading-spinner w-5 h-5 mr-2"></div>
                Analyzing ATS Compatibility...
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Analyze ATS Compatibility
              </>
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(analysis.overallScore / 100) * 314.16} 314.16`}
                    className={getScoreBgColor(analysis.overallScore)}
                    stroke="currentColor"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}
                    </div>
                    <div className="text-sm text-muted">ATS Score</div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {analysis.overallScore >= 80 ? 'Excellent ATS Compatibility' :
                 analysis.overallScore >= 60 ? 'Good ATS Compatibility' :
                 'Needs ATS Improvement'}
              </h3>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.categories).map(([key, category]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-text capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <span className={`font-bold ${getScoreColor(category.score)}`}>
                    {category.score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${getScoreBgColor(category.score)}`}
                    style={{ width: `${category.score}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted mb-2">{category.analysis}</p>
                {category.recommendations && category.recommendations.length > 0 && (
                  <div className="space-y-1">
                    {category.recommendations.slice(0, 2).map((rec, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-muted">{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Keyword Gaps */}
          {analysis.keywordGaps && analysis.keywordGaps.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
                <FileSearch className="w-5 h-5 mr-2" />
                Missing Keywords
              </h3>
              <div className="space-y-3">
                {analysis.keywordGaps.slice(0, 5).map((gap, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <span className="font-medium text-text">{gap.keyword}</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        gap.importance === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                        gap.importance === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                        {gap.importance}
                      </span>
                    </div>
                    {gap.suggestions && gap.suggestions.length > 0 && (
                      <span className="text-xs text-muted">{gap.suggestions[0]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {analysis.quickWins && analysis.quickWins.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Quick Wins
              </h3>
              <ul className="space-y-2">
                {analysis.quickWins.map((win, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800 dark:text-green-200">{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setAnalysis(null)}
              className="btn btn-ghost flex-1"
            >
              Analyze Another Job
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary flex-1"
            >
              Save Analysis Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}