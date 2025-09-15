import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import HeroUpload from '../components/ui/HeroUpload';
import SeoHead from '../components/SeoHead';

export default function Home(){
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Show loading state during redirect
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show homepage for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <>
        <SeoHead canonical="https://tailoredcv.app/" />
        <HeroUpload />
      </>
    );
  }

  return null; // Redirecting to dashboard
}
