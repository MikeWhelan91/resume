import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BarChart3,
  FileText,
  Plus,
  Download,
  TrendingUp,
  Calendar,
  Target,
  Users,
  Clock,
  Sparkles,
  Crown,
  ChevronRight,
  Activity,
  Zap,
  Trophy,
  Eye,
  Upload,
  CloudUpload
} from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { getTerminology } = useLanguage();
  const terms = getTerminology();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentResumes: [],
    entitlement: null,
    usage: null
  });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, resumesResponse, entitlementResponse, usageResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/resumes?limit=5'),
        fetch('/api/entitlements'),
        fetch('/api/usage')
      ]);

      const data = {
        stats: statsResponse.ok ? await statsResponse.json() : null,
        recentResumes: resumesResponse.ok ? await resumesResponse.json() : [],
        entitlement: entitlementResponse.ok ? await entitlementResponse.json() : null,
        usage: usageResponse.ok ? await usageResponse.json() : null
      };

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanDisplayName = (plan) => {
    switch (plan) {
      case 'free': return 'Free Plan';
      case 'day_pass': return 'Day Pass';
      case 'pro_monthly': return 'Pro Monthly';
      case 'pro_yearly': return 'Pro Yearly';
      default: return 'Free Plan';
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit || limit === 'unlimited') return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const handleFileUpload = (file) => {
    if (file && file.type === 'application/pdf') {
      // Store the file and redirect to wizard with upload flag
      const fileUrl = URL.createObjectURL(file);
      router.push(`/wizard?upload=true&fileName=${encodeURIComponent(file.name)}`);
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const { stats, recentResumes, entitlement, usage } = dashboardData;

  return (
    <>
      <SeoHead
        title="Dashboard - TailoredCV.app"
        description="Your personal resume dashboard with insights and quick actions."
        canonical="https://tailoredcv.app/dashboard"
        robots="noindex,nofollow"
      />

      <div className="min-h-screen bg-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-heading mb-2">
                  Welcome back, {session.user.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-muted">Here's what's happening with your resumes</p>
              </div>
              <Link href="/wizard" className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create {terms.Resume}
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

            {/* Total Resumes */}
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Total {terms.ResumePlural}</p>
                  <p className="text-2xl font-bold text-text">{stats?.totalResumes || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{stats?.resumesThisMonth || 0} this month</span>
              </div>
            </div>

            {/* Downloads */}
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Downloads</p>
                  <p className="text-2xl font-bold text-text">{stats?.totalDownloads || 0}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Activity className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">{stats?.downloadsThisWeek || 0} this week</span>
              </div>
            </div>


            {/* Plan Status */}
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Current Plan</p>
                  <p className="text-lg font-bold text-text">{getPlanDisplayName(entitlement?.plan)}</p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  {entitlement?.plan === 'free' ? (
                    <Users className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <Crown className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                {entitlement?.plan === 'free' ? (
                  <Link href="/pricing" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                    Upgrade Plan →
                  </Link>
                ) : (
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Recent Activity */}
              <div className="bg-surface rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-text flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    Recent Activity
                  </h2>
                  <Link
                    href="/my-resumes"
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    View All →
                  </Link>
                </div>

                {recentResumes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted">No {terms.resumePlural} yet</p>
                    <Link href="/wizard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                      Create your first {terms.resume} →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentResumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center justify-between p-4 bg-bg rounded-lg border border-border hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-text">{resume.name || `Untitled ${terms.Resume}`}</p>
                            <p className="text-sm text-muted">Created {formatDate(resume.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {resume.isLatest && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Latest
                            </span>
                          )}
                          <Link
                            href={`/wizard?resume=${resume.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-surface rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-text mb-6 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                  Quick Actions
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Link
                    href="/wizard"
                    className="flex items-center p-4 bg-bg rounded-lg border border-border hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                  >
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg mr-4">
                      <Plus className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text">Create New {terms.Resume}</p>
                      <p className="text-sm text-muted">Start from scratch</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-indigo-600" />
                  </Link>


                  <Link
                    href="/account"
                    className="flex items-center p-4 bg-bg rounded-lg border border-border hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                  >
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg mr-4">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text">Account Settings</p>
                      <p className="text-sm text-muted">Manage billing and preferences</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-purple-600" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="flex items-center p-4 bg-bg rounded-lg border border-border hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                  >
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg mr-4">
                      <Crown className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text">Upgrade Plan</p>
                      <p className="text-sm text-muted">Unlock premium features</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-yellow-600" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">


              {/* Pro Features */}
              {entitlement?.plan === 'free' && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center mb-3">
                    <Crown className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
                  </div>
                  <ul className="space-y-2 text-sm mb-4">
                    <li className="flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Unlimited {terms.resume} credits
                    </li>
                    <li className="flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Unlimited downloads
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Advanced ATS optimization
                    </li>
                    <li className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Premium templates
                    </li>
                  </ul>
                  <Link
                    href="/pricing"
                    className="w-full bg-white text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center block"
                  >
                    Upgrade Now
                  </Link>
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tip</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Use the ATS optimizer to improve your {terms.resume}'s compatibility with applicant tracking systems and increase your chances of getting noticed.
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}