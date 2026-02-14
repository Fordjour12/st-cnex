import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { UserService } from '@/lib/server/user'

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
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)

    return UserService.getUsers(data)
  })

const getUserByIdSchema = z.object({
  userId: z.string(),
})

export const getAdminUserById = createServerFn({ method: 'GET' })
  .inputValidator(getUserByIdSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_VIEW)

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
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.USERS_SUSPEND,
    )

    return UserService.suspendUser({
      ...data,
      suspendedBy: sessionUser.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })
  })

const banUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
})

export const banAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(banUserSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.USERS_BAN,
    )

    return UserService.banUser({
      ...data,
      bannedBy: sessionUser.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })
  })

const liftSuspensionSchema = z.object({
  userId: z.string(),
})

export const liftUserSuspension = createServerFn({ method: 'POST' })
  .inputValidator(liftSuspensionSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.USERS_SUSPEND,
    )

    return UserService.liftSuspension({
      ...data,
      liftedBy: sessionUser.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })
  })
