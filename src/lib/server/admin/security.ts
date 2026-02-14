import { getRequestHeaders } from '@tanstack/react-start/server'

import type { Permission } from '@/lib/permissions'
import { auth } from '@/lib/auth'
import { RBACService } from '@/lib/server/rbac'

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RequestMetadata {
  ipAddress?: string
  userAgent?: string
}

const ADMIN_RATE_LIMIT_WINDOW_MS = 60_000
const ADMIN_RATE_LIMIT_MAX_REQUESTS = 120
const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIp(headers: Headers): string | undefined {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first.slice(0, 45)
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.slice(0, 45)

  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp.slice(0, 45)

  return undefined
}

function enforceRateLimit(key: string) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + ADMIN_RATE_LIMIT_WINDOW_MS,
    })
    return
  }

  if (current.count >= ADMIN_RATE_LIMIT_MAX_REQUESTS) {
    throw new Error('RATE_LIMITED')
  }

  rateLimitStore.set(key, {
    count: current.count + 1,
    resetAt: current.resetAt,
  })
}

export async function requireAdminPermission(permission?: Permission) {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  const ipAddress = getClientIp(headers)
  const userAgent = headers.get('user-agent') ?? undefined
  const metadata: RequestMetadata = { ipAddress, userAgent }

  enforceRateLimit(`admin:${session.user.id}`)
  if (ipAddress) {
    enforceRateLimit(`admin-ip:${ipAddress}`)
  }

  if (permission) {
    const hasPermission = await RBACService.hasPermission(session.user.id, permission)
    if (!hasPermission) {
      throw new Error('FORBIDDEN')
    }
  }

  return {
    user: session.user,
    metadata,
  }
}
