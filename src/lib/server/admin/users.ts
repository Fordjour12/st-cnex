import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import type { Permission } from '@/lib/permissions'
import { auth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { RBACService } from '@/lib/server/rbac'
import { UserService } from '@/lib/server/user'

async function getSessionUser() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user
}

async function assertPermission(userId: string, permission: Permission) {
  const hasPermission = await RBACService.hasPermission(userId, permission)

  if (!hasPermission) {
    throw new Error('FORBIDDEN')
  }
}

const getUsersSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const getAdminUsers = createServerFn({ method: 'GET' })
  .inputValidator(getUsersSchema)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()
    await assertPermission(sessionUser.id, PERMISSIONS.USERS_VIEW)

    return UserService.getUsers(data)
  })

const getUserByIdSchema = z.object({
  userId: z.string(),
})

export const getAdminUserById = createServerFn({ method: 'GET' })
  .inputValidator(getUserByIdSchema)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()
    await assertPermission(sessionUser.id, PERMISSIONS.USERS_VIEW)

    const user = await UserService.getUserById(data.userId)
    const profile = await UserService.getUserProfile(data.userId)
    const suspension = await UserService.getUserSuspension(data.userId)

    return { user, profile, suspension }
  })

const suspendUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
  expiresAt: z.coerce.date().optional(),
})

export const suspendAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(suspendUserSchema)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()
    await assertPermission(sessionUser.id, PERMISSIONS.USERS_SUSPEND)

    return UserService.suspendUser({
      ...data,
      suspendedBy: sessionUser.id,
    })
  })

const banUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
})

export const banAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(banUserSchema)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()
    await assertPermission(sessionUser.id, PERMISSIONS.USERS_BAN)

    return UserService.banUser({
      ...data,
      bannedBy: sessionUser.id,
    })
  })

const liftSuspensionSchema = z.object({
  userId: z.string(),
})

export const liftUserSuspension = createServerFn({ method: 'POST' })
  .inputValidator(liftSuspensionSchema)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()
    await assertPermission(sessionUser.id, PERMISSIONS.USERS_SUSPEND)

    return UserService.liftSuspension({
      ...data,
      liftedBy: sessionUser.id,
    })
  })
