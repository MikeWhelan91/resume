import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerified: new Date(), // Auto-verify for email/password signup
      }
    })

    // Create entitlement for new user
    await prisma.entitlement.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'active',
        features: {
          docx: false,
          cover_letter: false,
          max_req_per_min: 10
        }
      }
    })

    return res.status(201).json({ 
      success: true,
      message: 'Account created successfully! You can now sign in.' 
    })

  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again.' 
    })
  }
}