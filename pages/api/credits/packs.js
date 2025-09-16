import { CREDIT_PACKS } from '../../../lib/credit-purchase-system'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Return available credit packs with EUR pricing
    const packs = Object.values(CREDIT_PACKS).map(pack => ({
      ...pack,
      priceDisplay: `€${(pack.price / 100).toFixed(2)}`,
      creditValue: `€${(pack.price / pack.credits / 100).toFixed(2)} per credit`
    }))

    return res.status(200).json({ packs })
  } catch (error) {
    console.error('Error fetching credit packs:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}