import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Clock, FileText, Calendar, Trash2, Edit, Crown } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function MyResumes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchResumes();
    }
  }, [status, router]);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      } else {
        console.error('Failed to fetch resumes');
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setResumes(resumes.filter(r => r.id !== id));
      } else {
        alert('Failed to delete resume. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const loadResume = async (id) => {
    try {
      const response = await fetch(`/api/resumes/${id}`);
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('resumeWizardDraft', JSON.stringify(data.data));
        router.push('/wizard');
      } else {
        alert('Failed to load resume. Please try again.');
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      alert('Failed to load resume. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpiryText = (expiresAt) => {
    if (!expiresAt) return null;
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft === 1) return '1 day left';
    if (daysLeft <= 7) return `${daysLeft} days left`;
    if (daysLeft <= 30) return `${Math.ceil(daysLeft / 7)} weeks left`;
    return `${Math.ceil(daysLeft / 30)} months left`;
  };

  const getExpiryColor = (expiresAt) => {
    if (!expiresAt) return '';
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return 'text-red-600';
    if (daysLeft <= 3) return 'text-red-500';
    if (daysLeft <= 7) return 'text-orange-500';
    return 'text-gray-500';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title="My Saved Resumes – TailoredCV.app"
        description="View and manage your saved resumes"
        canonical="https://tailoredcv.app/my-resumes"
        robots="noindex,nofollow"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Saved Resumes</h1>
                <p className="text-gray-600">View, edit, and manage your saved resumes</p>
              </div>
              <Link href="/wizard" className="btn btn-primary">
                <FileText className="w-4 h-4 mr-2" />
                Create New Resume
              </Link>
            </div>
          </div>

          {/* Resume Grid */}
          {resumes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved resumes yet</h3>
              <p className="text-gray-600 mb-6">Create your first resume to get started</p>
              <Link href="/wizard" className="btn btn-primary">
                <FileText className="w-4 h-4 mr-2" />
                Create Resume
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {resume.name || 'Untitled Resume'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Template: {resume.template || 'Classic'}
                        </p>
                      </div>
                      {resume.isLatest && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created {formatDate(resume.createdAt)}
                      </div>
                      {resume.expiresAt && (
                        <div className={`flex items-center text-sm ${getExpiryColor(resume.expiresAt)}`}>
                          <Clock className="w-4 h-4 mr-2" />
                          {getExpiryText(resume.expiresAt)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadResume(resume.id)}
                        className="flex-1 btn btn-primary btn-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteResume(resume.id)}
                        disabled={deletingId === resume.id}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === resume.id ? (
                          <div className="loading-spinner w-4 h-4"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Storage Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <div className="text-sm text-blue-800">
                <strong>Storage Policy:</strong> Free users can save 1 resume (expires after 1 week). 
                Pro users can save up to 10 resumes (expire after 1 year). 
                Day pass users can save 1 resume (expires 1 week after pass ends).
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}