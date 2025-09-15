import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import HeroUpload from '../components/ui/HeroUpload';
import SeoHead from '../components/SeoHead';

export default function Home(){
  const { data: session, status } = useSession();
  const router = useRouter();

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show homepage for all users (both authenticated and unauthenticated)
  return (
    <>
      <SeoHead canonical="https://tailoredcv.app/" />
      <HeroUpload />
    </>
  );
}
