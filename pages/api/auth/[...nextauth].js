// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../lib/prisma.js'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
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
    async jwt({ token, user }) {
      if (user) token.userId = user.id            // put DB id in the JWT
      return token
    },
    async session({ session, token }) {
      if (token?.userId) session.user.id = token.userId // expose id on session
      return session
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
