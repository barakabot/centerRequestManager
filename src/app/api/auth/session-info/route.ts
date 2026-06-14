import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/auth/session-info — Returns current user session info
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role,
        branchId: (session.user as any).branchId,
        branchName: (session.user as any).branchName,
        branchCode: (session.user as any).branchCode,
        isActive: (session.user as any).isActive,
      },
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
