import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

// Simple hash function for passwords (using Bun's built-in)
// In production, use bcrypt or argon2
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'ایمیل', type: 'email' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { branch: { select: { id: true, name: true, code: true } } },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) {
          return null
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          branchName: user.branch?.name || null,
          branchCode: user.branch?.code || null,
          isActive: user.isActive,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.branchId = (user as any).branchId
        token.branchName = (user as any).branchName
        token.branchCode = (user as any).branchCode
        token.isActive = (user as any).isActive
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).branchId = token.branchId
        ;(session.user as any).branchName = token.branchName
        ;(session.user as any).branchCode = token.branchCode
        ;(session.user as any).isActive = token.isActive
      }
      return session
    },
  },
  pages: {
    signIn: '/', // We'll handle login as an overlay on the main page
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'target-management-system-secret-key-2024',
}

export { hashPassword, verifyPassword }
