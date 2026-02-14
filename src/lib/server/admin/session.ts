import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { RBACService } from '@/lib/server/rbac'
import { UserService } from '@/lib/server/user'

export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const headers = getRequestHeaders()
      const { user } = await requireAdminPermission()
      const currentSession = await auth.api.getSession({ headers })
      const isAdmin = await RBACService.isAdmin(user.id)
      return {
        authenticated: true as const,
        isAdmin,
        user,
        impersonating: Boolean(currentSession?.session.impersonatedBy),
        impersonatedBy: currentSession?.session.impersonatedBy ?? null,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message !== 'UNAUTHORIZED') {
        throw error
      }

      return {
        authenticated: false as const,
        isAdmin: false as const,
        user: null,
        impersonating: false as const,
        impersonatedBy: null,
      }
    }
  },
)

const userSessionSchema = z.object({
  userId: z.string(),
})

export const listUserSessions = createServerFn({ method: 'POST' })
  .inputValidator(userSessionSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)
    const headers = getRequestHeaders()

    return auth.api.listUserSessions({
      headers,
      body: {
        userId: data.userId,
      },
    })
  })

const revokeUserSessionSchema = z.object({
  sessionToken: z.string(),
})

export const revokeUserSession = createServerFn({ method: 'POST' })
  .inputValidator(revokeUserSessionSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_UPDATE)
    const headers = getRequestHeaders()

    return auth.api.revokeUserSession({
      headers,
      body: {
        sessionToken: data.sessionToken,
      },
    })
  })

export const revokeAllUserSessions = createServerFn({ method: 'POST' })
  .inputValidator(userSessionSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_UPDATE)
    const headers = getRequestHeaders()

    return auth.api.revokeUserSessions({
      headers,
      body: {
        userId: data.userId,
      },
    })
  })

export const impersonateUser = createServerFn({ method: 'POST' })
  .inputValidator(userSessionSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(PERMISSIONS.USERS_UPDATE)
    const headers = getRequestHeaders()

    const result = await auth.api.impersonateUser({
      headers,
      body: {
        userId: data.userId,
      },
    })

    await UserService.createAuditLog({
      userId: sessionUser.id,
      targetUserId: data.userId,
      action: 'role_assigned',
      resource: 'sessions',
      resourceId: data.userId,
      details: JSON.stringify({ event: 'impersonate_user' }),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })

    return result
  })

export const stopImpersonating = createServerFn({ method: 'POST' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const beforeSession = await auth.api.getSession({ headers })

    const result = await auth.api.stopImpersonating({
      headers,
    })

    await UserService.createAuditLog({
      userId: result.user.id,
      targetUserId: beforeSession?.user.id,
      action: 'role_assigned',
      resource: 'sessions',
      resourceId: beforeSession?.user.id,
      details: JSON.stringify({ event: 'stop_impersonating' }),
      ipAddress: headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    })

    return result
  },
)
