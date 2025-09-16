import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { CreditCard, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

const CREDIT_PACKS = {
  starter: { name: 'Starter Pack', credits: 6, price: 5, description: 'Perfect for trying out our service' },
  standard: { name: 'Standard Pack', credits: 20, price: 15, description: 'Great for regular job searching' },
  professional: { name: 'Professional Pack', credits: 60, price: 35, description: 'Best value for active job seekers' },
  bulk: { name: 'Bulk Pack', credits: 150, price: 75, description: 'Perfect for career coaches and agencies' }
};

export default function PurchaseCredits() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPack, setSelectedPack] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.query.pack && CREDIT_PACKS[router.query.pack]) {
      setSelectedPack(CREDIT_PACKS[router.query.pack]);
    }
  }, [router.query.pack]);

  const handlePurchase = async () => {
    if (!session || !selectedPack) return;

    setLoading(true);
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: router.query.pack })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create purchase');
      }

      const { url } = await res.json();

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (err) {
      console.error('Purchase error:', err);
      alert('Unable to process purchase. Please try again.');
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text mb-4">Please Sign In</h1>
          <p className="text-muted mb-6">You need to be signed in to purchase credits.</p>
          <Link href="/auth/signin" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedPack) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text mb-4">Invalid Credit Pack</h1>
          <p className="text-muted mb-6">The selected credit pack was not found.</p>
          <Link href="/pricing" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90">
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/pricing" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Link>
          <h1 className="text-3xl font-bold text-text mb-2">Purchase Credits</h1>
          <p className="text-muted">Complete your credit pack purchase</p>
        </div>

        {/* Selected Pack */}
        <div className="bg-surface rounded-2xl p-6 border border-border mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">{selectedPack.name}</h2>
              <p className="text-muted">{selectedPack.description}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-text">Credits:</span>
              <span className="font-medium text-text">{selectedPack.credits}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-text">Price:</span>
              <span className="text-2xl font-bold text-text">€{selectedPack.price}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-text">{selectedPack.credits} credits</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-text">10 downloads per generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-text">Credits never expire</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <div className="text-center">
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="bg-primary text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Purchase for €${selectedPack.price}`}
          </button>
          <p className="text-xs text-muted mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}