import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import ResumeTemplate from '../ResumeTemplate';

export default function ResumePreview({
  userData,
  template,
  accent,
  userPlan,
  title = "Resume Preview",
  showTemplateSelector = true,
  onTemplateChange,
  onAccentChange,
  templates = [],
  accents = []
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {showTemplateSelector && (
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle controls"
            >
              {showControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Template & Accent Controls */}
      {showTemplateSelector && showControls && (
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Selector */}
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Style
                </label>
                <select
                  value={template}
                  onChange={(e) => onTemplateChange?.(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Accent Color Selector */}
            {accents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex space-x-2">
                  {accents.map((color) => (
                    <button
                      key={color}
                      onClick={() => onAccentChange?.(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        accent === color
                          ? 'border-gray-400 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className={`bg-gray-50 p-6 ${isExpanded ? 'min-h-screen' : ''}`}>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto"
             style={{
               aspectRatio: '210/297',
               height: isExpanded ? '800px' : '400px',
               maxWidth: isExpanded ? '600px' : '300px',
               overflow: 'auto'
             }}>
          <div style={{
            transform: isExpanded ? 'scale(0.75)' : 'scale(0.6)',
            transformOrigin: 'top left',
            width: isExpanded ? '133.33%' : '166.67%'
          }}>
            <ResumeTemplate
              userData={userData}
              accent={accent}
              template={template}
              userPlan={userPlan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}