import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, FileText, Plus, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const emptyResume = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  links: [],
  skills: [],
  experience: [],
  projects: [],
  education: []
};

export default function WizardEntry({ onStart }) {
  const { data: session } = useSession();
  const { getTerminology } = useLanguage();
  const terms = getTerminology();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasLatestResume, setHasLatestResume] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showStartOptions, setShowStartOptions] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (session?.user) {
        // Load both draft and latest resume for authenticated users
        try {
          const [draftResponse, latestResponse] = await Promise.all([
            fetch('/api/get-draft'),
            fetch('/api/resumes/latest')
          ]);

          if (draftResponse.ok) {
            const data = await draftResponse.json();
            setDraft(data.draftData);
          }

          setHasLatestResume(latestResponse.ok);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      } else {
        // Load from localStorage for anonymous users (but don't auto-start)
        try {
          const saved = JSON.parse(localStorage.getItem('resumeWizardDraft') || 'null');
          if (saved && saved.name) {
            setDraft(saved);
          }
        } catch (error) {
          console.error('Error loading localStorage draft:', error);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [session]);

  const handleContinueDraft = () => {
    onStart(draft, selectedRoute);
  };

  const handleRouteSelection = (route) => {
    setSelectedRoute(route);
    if (route === 'ats') {
      // For ATS route, go directly to wizard with upload interface
      onStart(emptyResume, route);
    } else {
      // For other routes, show start options (fresh, continue, upload)
      setShowStartOptions(true);
    }
  };

  const handleStartFresh = () => {
    // For anonymous users, clear localStorage
    if (!session?.user) {
      localStorage.removeItem('resumeWizardDraft');
    }
    onStart(emptyResume, selectedRoute);
  };

  const handleUseLatest = async () => {
    setLoadingResume(true);
    try {
      const response = await fetch('/api/resumes/latest');
      if (response.ok) {
        const data = await response.json();
        onStart(data.data, selectedRoute);
      } else {
        alert(`Failed to load your latest ${terms.resume}. Please try again.`);
      }
    } catch (error) {
      console.error('Error loading latest resume:', error);
      alert(`Failed to load your latest ${terms.resume}. Please try again.`);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleUploadResume = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const uploadedData = data.resumeData || emptyResume;
        onStart(uploadedData, selectedRoute);
      } else {
        alert(data.error || `Failed to process ${terms.resume}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to process ${terms.resume}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const getDraftPreview = () => {
    if (!draft) return null;

    const parts = [];
    if (draft.name) parts.push(draft.name);
    if (draft.title) parts.push(draft.title);
    if (draft.experience?.length) parts.push(`${draft.experience.length} job${draft.experience.length > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' • ') : `${terms.Resume} in progress`;
  };

  const getLastSaved = () => {
    // For localStorage, we don't have timestamp, so just show generic message
    if (!session?.user) return 'Saved locally';

    // For database drafts, you could add a timestamp field
    return 'Recently saved';
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-muted">Loading your drafts...</p>
        </div>
      </div>
    );
  }

  // Show start options after route selection (except for ATS)
  if (showStartOptions && selectedRoute && selectedRoute !== 'ats') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-3">{selectedRoute === 'cv' ? `${terms.Resume} Only` : selectedRoute === 'cover-letter' ? 'Cover Letter Only' : 'Complete Package'}</h1>
          <p className="text-muted">How would you like to start?</p>
          <button
            onClick={() => { setSelectedRoute(null); setShowStartOptions(false); }}
            className="text-sm text-muted hover:text-text transition-colors mt-2"
          >
            ← Change selection
          </button>
        </div>

        <div className="space-y-4">
          {/* Continue Draft Option - Only for users with existing drafts */}
          {draft && (
            <div className="card p-6 border-2 border-blue-200 bg-blue-50/50">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text mb-1">Continue where you left off?</h3>
                  <p className="text-sm text-muted mb-2">{getDraftPreview()}</p>
                  <p className="text-xs text-blue-600">{getLastSaved()}</p>
                </div>
                <button
                  onClick={handleContinueDraft}
                  className="btn btn-primary flex-shrink-0"
                >
                  Continue Draft
                </button>
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className={`grid grid-cols-1 gap-4 ${
            session?.user && hasLatestResume
              ? 'md:grid-cols-3'
              : 'md:grid-cols-2'
          }`}>
            {/* Start Fresh Option */}
            <button
              onClick={handleStartFresh}
              className="card p-8 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-2 text-lg">Start Fresh</h3>
                  <p className="text-sm text-muted">Create a new {selectedRoute === 'cover-letter' ? 'cover letter' : terms.resume} from scratch using our step-by-step wizard</p>
                </div>
              </div>
            </button>

            {/* Upload Resume Option */}
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadResume(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <div className={`card p-8 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text mb-2 text-lg">
                      {uploading ? 'Processing...' : `Upload ${terms.Resume}`}
                    </h3>
                    <p className="text-sm text-muted">
                      {uploading ? 'Please wait while we process your file...' : `Upload your existing ${terms.resume} and we'll help you improve it`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Latest Resume Option - Only for authenticated users with resumes */}
            {session?.user && hasLatestResume && (
              <button
                onClick={handleUseLatest}
                disabled={loadingResume}
                className="card p-8 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text mb-2 text-lg">
                      {loadingResume ? 'Loading...' : `Use Latest ${terms.Resume}`}
                    </h3>
                    <p className="text-sm text-muted">
                      {loadingResume ? 'Loading your latest resume...' : `Start with your most recently generated ${terms.resume}`}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Show route selector first (default view)
  if (!selectedRoute) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-3">Choose Your Path</h1>
          <p className="text-muted">What would you like to create or analyze?</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* CV Option */}
            <button
              onClick={() => handleRouteSelection('cv')}
              className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left border-2 hover:border-blue-200"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-lg">{terms.Resume} Only</h3>
                  <p className="text-sm text-muted">Create a tailored {terms.resume} optimized for your target role</p>
                </div>
              </div>
            </button>

            {/* Cover Letter Option */}
            <button
              onClick={() => handleRouteSelection('cover-letter')}
              className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left border-2 hover:border-green-200"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-lg">Cover Letter Only</h3>
                  <p className="text-sm text-muted">Generate a personalized cover letter for the specific position</p>
                </div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Both Option */}
            <button
              onClick={() => handleRouteSelection('both')}
              className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left border-2 hover:border-purple-200"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-lg">Complete Package</h3>
                  <p className="text-sm text-muted">Get both a tailored {terms.resume} and cover letter</p>
                </div>
              </div>
            </button>

            {/* CV Health Check Option */}
            <button
              onClick={() => handleRouteSelection('ats')}
              className="card p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left border-2 hover:border-orange-200"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-lg flex items-center gap-2">
                    CV Health Check
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">ANALYZER</span>
                  </h3>
                  <p className="text-sm text-muted">Upload your existing CV for ATS compatibility analysis</p>
                </div>
              </div>
            </button>
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowRouteSelector(false)}
              className="text-sm text-muted hover:text-text transition-colors"
            >
              ← Back to options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This should never be reached, but just in case
  return null;
}
