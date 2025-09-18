import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Shield,
  Zap,
  FileText
} from 'lucide-react';

const ScoreCircle = ({ score, size = 'lg' }) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrokeColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`relative ${size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke={getStrokeColor(score)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${size === 'lg' ? 'text-2xl' : 'text-lg'} font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
};

const CategoryCard = ({ category, data, isExpanded, onToggle }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ScoreCircle score={data.score} size="sm" />
            <div>
              <h4 className="font-medium text-gray-900 capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <p className="text-sm text-gray-600">
                {data.score >= 80 ? 'Excellent' : data.score >= 60 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Analysis</h5>
              <p className="text-sm text-gray-700">{data.analysis}</p>
            </div>

            {data.recommendations && data.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
                  Recommendations
                </h5>
                <ul className="space-y-1">
                  {data.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ATSAnalysisCard({ analysis }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [activeTab, setActiveTab] = useState('overview');

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
        <p className="text-gray-600">Upload a CV to see your ATS compatibility analysis.</p>
      </div>
    );
  }

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'categories', label: 'Detailed Analysis', icon: TrendingUp },
    { id: 'improvements', label: 'Quick Wins', icon: Zap }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ATS Compatibility Analysis</h2>
            <p className="text-sm text-gray-600">
              Analyzed on {new Date(analysis.analyzedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex space-x-8 px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <ScoreCircle score={analysis.overallScore} />
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                Overall ATS Score: {analysis.overallScore}/100
              </h3>
              <p className="text-gray-600">
                {analysis.overallScore >= 80
                  ? 'Excellent! Your CV is well-optimized for ATS systems.'
                  : analysis.overallScore >= 60
                  ? 'Good foundation with room for improvement.'
                  : 'Significant improvements needed for better ATS compatibility.'
                }
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analysis.categories).map(([key, data]) => (
                <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{data.score}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4">
            {Object.entries(analysis.categories).map(([category, data]) => (
              <CategoryCard
                key={category}
                category={category}
                data={data}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
              />
            ))}
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="space-y-6">
            {/* Quick Wins */}
            {analysis.quickWins && analysis.quickWins.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Quick Wins
                </h3>
                <div className="space-y-2">
                  {analysis.quickWins.map((win, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{win}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            {analysis.issues && analysis.issues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Issues to Address
                </h3>
                <div className="space-y-2">
                  {analysis.issues.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Gaps */}
            {analysis.keywordGaps && analysis.keywordGaps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Opportunities</h3>
                <div className="grid gap-3">
                  {analysis.keywordGaps.map((gap, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{gap.keyword}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          gap.importance === 'high' ? 'bg-red-100 text-red-700' :
                          gap.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {gap.importance} priority
                        </span>
                      </div>
                      {gap.suggestions && gap.suggestions.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {gap.suggestions.map((suggestion, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}