import React, { useState } from 'react';
import { Download, FileText, FileImage, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DownloadSection({
  onDownload,
  downloadingStates = {},
  cooldowns = {},
  availableFormats = ['pdf', 'docx'],
  title = "Download",
  description = "Get your professionally formatted document",
  isPremiumFeature = false,
  userPlan = 'free'
}) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const isDownloading = downloadingStates[selectedFormat] || false;
  const cooldownRemaining = cooldowns[selectedFormat] || 0;
  const isOnCooldown = cooldownRemaining > 0;
  const canDownload = !isDownloading && !isOnCooldown;

  const formatIcons = {
    pdf: FileText,
    docx: FileImage
  };

  const formatLabels = {
    pdf: 'PDF Document',
    docx: 'Word Document'
  };

  const handleDownload = () => {
    if (canDownload) {
      onDownload?.(selectedFormat);
    }
  };

  const getButtonState = () => {
    if (isDownloading) return { text: 'Downloading...', icon: Clock, disabled: true, className: 'bg-blue-100 text-blue-700' };
    if (isOnCooldown) return { text: `Wait ${cooldownRemaining}s`, icon: Clock, disabled: true, className: 'bg-gray-100 text-gray-500' };
    return { text: 'Download', icon: Download, disabled: false, className: 'bg-blue-600 hover:bg-blue-700 text-white' };
  };

  const buttonState = getButtonState();
  const IconComponent = buttonState.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>

          {/* Format Selection */}
          {availableFormats.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Format
              </label>
              <div className="flex space-x-3">
                {availableFormats.map((format) => {
                  const Icon = formatIcons[format];
                  return (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        selectedFormat === format
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{format.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Feature Notice */}
          {isPremiumFeature && userPlan === 'free' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-800">
                    This format requires a premium plan.
                  </p>
                  <button className="text-sm text-amber-700 underline hover:text-amber-900 transition-colors">
                    Upgrade now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={buttonState.disabled || (isPremiumFeature && userPlan === 'free')}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${buttonState.className} disabled:cursor-not-allowed`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{buttonState.text}</span>
          </button>

          {/* Success Message */}
          {/* This would be shown after successful download */}
          {false && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Download completed successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}