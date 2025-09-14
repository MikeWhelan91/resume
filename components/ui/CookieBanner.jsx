import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CookieBanner() {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('cookieConsent') : null;
    if (stored) {
      if (stored === 'accepted' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
      }
      return;
    }

    const pref = session?.user?.cookiePreferences?.analytics;
    if (pref !== undefined) {
      localStorage.setItem('cookieConsent', pref ? 'accepted' : 'rejected');
      if (pref && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
      }
    } else {
      setVisible(true);
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'default', { analytics_storage: 'denied' });
      }
    }
  }, [session]);

  const handleChoice = async (accepted) => {
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'rejected');
    if (accepted && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    if (session?.user?.id) {
      try {
        await fetch('/api/user/cookie-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analytics: accepted })
        });
      } catch (err) {
        console.error('Failed to save cookie preference', err);
      }
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-border text-text p-4 z-50 text-sm">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex-1">
          We use cookies to improve your experience and for analytics. You can accept or decline analytics cookies.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleChoice(false)}
            className="px-4 py-2 bg-muted text-text rounded hover:bg-muted/80 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
