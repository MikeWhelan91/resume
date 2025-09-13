// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../lib/prisma.js'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.password) return null
        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null
        return { id: user.id, email: user.email, emailVerified: user.emailVerified }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        // For OAuth providers, get the DB user ID
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          if (dbUser) {
            token.userId = dbUser.id;
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.userId) session.user.id = token.userId
      return session
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user gets created with proper entitlement
      if (account?.provider === 'google') {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { entitlement: true }
          });
          
          // If user exists but has no entitlement, create one
          if (existingUser && !existingUser.entitlement) {
            await prisma.entitlement.create({
              data: {
                userId: existingUser.id,
                plan: 'free',
                status: 'active',
                freeWeeklyCreditsRemaining: 10
              }
            });
          }
        } catch (error) {
          console.error('Error ensuring entitlement for OAuth user:', error);
          // Continue with sign in even if entitlement creation fails
        }
        return true; // PrismaAdapter will handle user creation
      }
      return true;
    }
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request'
  },
  secret: process.env.NEXTAUTH_SECRET
  // Do NOT set "url" here; use NEXTAUTH_URL env = https://tailoredcv.app
}

export default NextAuth(authOptions)
