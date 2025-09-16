import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

function CreditPurchaseForm({ onSuccess, onClose }) {
  const { data: session } = useSession()
  const stripe = useStripe()
  const elements = useElements()
  const [packs, setPacks] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCreditPacks()
  }, [])

  const fetchCreditPacks = async () => {
    try {
      const response = await fetch('/api/credits/packs')
      const data = await response.json()
      setPacks(data.packs)
      if (data.packs.length > 0) {
        // Default to the popular pack
        const popularPack = data.packs.find(pack => pack.popular) || data.packs[1]
        setSelectedPack(popularPack)
      }
    } catch (error) {
      console.error('Error fetching credit packs:', error)
      setError('Failed to load credit packs')
    }
  }

  const handlePurchase = async (e) => {
    e.preventDefault()

    if (!stripe || !elements || !selectedPack) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create payment intent
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPack.id })
      })

      const { clientSecret, pack } = await response.json()

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: session?.user?.name,
            email: session?.user?.email
          }
        }
      })

      if (paymentError) {
        setError(paymentError.message)
      } else {
        onSuccess && onSuccess(pack)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setError(error.message || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Purchase Credits</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}
      </div>

      {/* Credit Pack Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedPack?.id === pack.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${pack.popular ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setSelectedPack(pack)}
          >
            {pack.popular && (
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded mb-2 inline-block">
                Most Popular
              </div>
            )}
            <h3 className="font-semibold text-lg">{pack.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{pack.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{pack.priceDisplay}</span>
              <span className="text-green-600 font-semibold">{pack.credits} credits</span>
            </div>
            <p className="text-xs text-gray-500">{pack.creditValue}</p>
          </div>
        ))}
      </div>

      {/* Payment Form */}
      {selectedPack && (
        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Details
            </label>
            <div className="border border-gray-300 rounded-md p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">
                You'll get <span className="font-semibold">{selectedPack.credits} credits</span> for{' '}
                <span className="font-semibold">{selectedPack.priceDisplay}</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={!stripe || loading}
              className={`px-6 py-2 rounded-md font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Processing...' : `Purchase ${selectedPack.credits} Credits`}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function CreditPurchase({ onSuccess, onClose }) {
  return (
    <Elements stripe={stripePromise}>
      <CreditPurchaseForm onSuccess={onSuccess} onClose={onClose} />
    </Elements>
  )
}