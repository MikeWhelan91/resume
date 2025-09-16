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
    onStart(draft);
  };

  const handleStartFresh = () => {
    // For anonymous users, clear localStorage
    if (!session?.user) {
      localStorage.removeItem('resumeWizardDraft');
    }
    onStart(emptyResume);
  };

  const handleUseLatest = async () => {
    setLoadingResume(true);
    try {
      const response = await fetch('/api/resumes/latest');
      if (response.ok) {
        const data = await response.json();
        onStart(data.data);
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
        onStart(uploadedData);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text mb-3">{terms.Resume} Wizard</h1>
        <p className="text-muted">Create a tailored {terms.resume} and cover letter for your next job application</p>
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

        {/* Options - Responsive Grid */}
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
                <p className="text-sm text-muted">Begin with a blank {terms.resume} form</p>
              </div>
            </div>
          </button>

          {/* Use Latest Resume Option - Only for authenticated users with saved resumes */}
          {session?.user && hasLatestResume && (
            <button
              onClick={handleUseLatest}
              disabled={loadingResume}
              className="card p-8 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  {loadingResume ? (
                    <div className="loading-spinner w-8 h-8 text-blue-600"></div>
                  ) : (
                    <Clock className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-2 text-lg">
                    {loadingResume ? 'Loading...' : `Use Latest ${terms.Resume}`}
                  </h3>
                  <p className="text-sm text-muted">
                    {loadingResume
                      ? 'Loading your saved resume...'
                      : `Continue with your most recent ${terms.resume}`
                    }
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Upload Resume Option */}
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadResume(file);
                }
              }}
              className="hidden"
              id="resume-upload"
              disabled={uploading}
            />
            <label
              htmlFor="resume-upload"
              className={`block card p-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                uploading
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
              }`}
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  {uploading ? (
                    <div className="loading-spinner w-8 h-8 text-purple-600"></div>
                  ) : (
                    <Upload className="w-8 h-8 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-2 text-lg">
                    {uploading ? 'Processing...' : `Upload ${terms.Resume}`}
                  </h3>
                  <p className="text-sm text-muted mb-1">
                    {uploading
                      ? 'Please wait while we process your file'
                      : `Import your existing ${terms.resume} to auto-fill information`
                    }
                  </p>
                  {!uploading && (
                    <p className="text-xs text-muted">Supports PDF, DOCX, and TXT files</p>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted">
          {session?.user
            ? 'Your progress is automatically saved to your account'
            : 'Anonymous users can save drafts locally until signing up'
          }
        </p>
      </div>
    </div>
  );
}