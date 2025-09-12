import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from '../../../lib/prisma.js'
import bcrypt from 'bcryptjs'

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId
        
        // Create entitlement record if it doesn't exist
        const entitlement = await prisma.entitlement.findUnique({
          where: { userId: token.userId }
        })
        
        if (!entitlement) {
          await prisma.entitlement.create({
            data: {
              userId: token.userId,
              plan: 'free',
              status: 'active',
              features: {
                docx: false,
                cover_letter: false,
                max_req_per_min: 10
              }
            }
          })
        }
      }
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Allow NextAuth to automatically detect URL in production
  ...(process.env.NODE_ENV === 'production' && {
    url: process.env.NEXTAUTH_URL || 'https://tailoredcv.onrender.com'
  }),
})