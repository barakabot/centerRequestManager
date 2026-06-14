import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Role-based access control for API routes
const roleAccessMap: Record<string, string[]> = {
  admin: ['/api/admin', '/api/branches', '/api/product-groups', '/api/salesmen', '/api/periods', '/api/targets', '/api/ad-hoc-requests', '/api/dashboard', '/api/excel-import'],
  planning: ['/api/branches', '/api/product-groups', '/api/salesmen', '/api/periods', '/api/targets', '/api/ad-hoc-requests', '/api/dashboard', '/api/excel-import'],
  branch_manager: ['/api/branches', '/api/product-groups', '/api/salesmen', '/api/periods', '/api/targets', '/api/ad-hoc-requests', '/api/dashboard', '/api/excel-import'],
}

// Routes that require specific roles
const adminOnlyRoutes = ['/api/admin']

export const config = {
  matcher: ['/api/:path*'],
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth routes (login, session-info)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Only protect API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'target-management-system-secret-key-2024',
    })

    if (!token) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز - ابتدا وارد شوید' }, { status: 401 })
    }

    const userRole = token.role as string

    // Check admin-only routes
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'admin' && userRole !== 'planning') {
        return NextResponse.json({ error: 'شما دسترسی به این بخش ندارید' }, { status: 403 })
      }
    }

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', (token.id as string) || '')
    requestHeaders.set('x-user-role', userRole || '')
    requestHeaders.set('x-user-branch-id', (token.branchId as string) || '')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}


