import { createServerFn } from '@tanstack/react-start/server'
import { UserService } from '~/lib/server/user'
import { RBACService } from '~/lib/server/rbac'
import { PERMISSIONS } from '~/lib/permissions'
import { auth } from '@/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

async function getSessionUser() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session.user
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

    const hasPermission = await RBACService.hasPermission(
      sessionUser.id,
      PERMISSIONS.USERS_VIEW,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.view')
    }

    return await UserService.getUsers(data)
  })

export const getAdminUserById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()

    const hasPermission = await RBACService.hasPermission(
      sessionUser.id,
      PERMISSIONS.USERS_VIEW,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.view')
    }

    const user = await UserService.getUserById(data.userId)
    const profile = await UserService.getUserProfile(data.userId)
    const suspension = await UserService.getUserSuspension(data.userId)

    return { user, profile, suspension }
  })

const suspendUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
  expiresAt: z.date().optional(),
})

export const suspendAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(suspendUserSchema)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser()

    const hasPermission = await RBACService.hasPermission(
      sessionUser.id,
      PERMISSIONS.USERS_SUSPEND,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.suspend')
    }

    return await UserService.suspendUser({
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

    const hasPermission = await RBACService.hasPermission(
      sessionUser.id,
      PERMISSIONS.USERS_BAN,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.ban')
    }

    return await UserService.banUser({
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

    const hasPermission = await RBACService.hasPermission(
      sessionUser.id,
      PERMISSIONS.USERS_SUSPEND,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.suspend')
    }

    return await UserService.liftSuspension({
      ...data,
      liftedBy: sessionUser.id,
    })
  })
