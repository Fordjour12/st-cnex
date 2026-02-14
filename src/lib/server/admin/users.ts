import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { RBACService } from '@/lib/server/rbac'
import { UserService } from '@/lib/server/user'

const authRoleSchema = z.union([z.literal('user'), z.literal('admin')])

const getUsersSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  search: z.string().optional(),
  role: z.string().optional(),
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
    const roles = await RBACService.getUserRoles(data.userId)

    return { user, profile, suspension, roles }
  })

const createAdminUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  role: z.union([authRoleSchema, z.array(authRoleSchema)]).optional(),
})

export const createAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(createAdminUserSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_CREATE)
    const headers = getRequestHeaders()
    return auth.api.createUser({
      headers,
      body: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
      },
    })
  })

const updateAdminUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).optional(),
  email: z.email().optional(),
})

export const updateAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(updateAdminUserSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_UPDATE)
    const headers = getRequestHeaders()

    const updateData: Record<string, string> = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email

    return auth.api.adminUpdateUser({
      headers,
      body: {
        userId: data.userId,
        data: updateData,
      },
    })
  })

const setAdminUserPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(8),
})

export const setAdminUserPassword = createServerFn({ method: 'POST' })
  .inputValidator(setAdminUserPasswordSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.USERS_UPDATE)
    const headers = getRequestHeaders()

    return auth.api.setUserPassword({
      headers,
      body: {
        userId: data.userId,
        newPassword: data.newPassword,
      },
    })
  })

const deleteAdminUserSchema = z.object({
  userId: z.string(),
})

export const deleteAdminUser = createServerFn({ method: 'POST' })
  .inputValidator(deleteAdminUserSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(PERMISSIONS.USERS_DELETE)
    if (data.userId === sessionUser.id) {
      throw new Error('BAD_REQUEST')
    }

    const headers = getRequestHeaders()
    return auth.api.removeUser({
      headers,
      body: {
        userId: data.userId,
      },
    })
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

const setUserRoleSchema = z.object({
  userId: z.string(),
  role: z.union([authRoleSchema, z.array(authRoleSchema)]),
})

export const setAdminUserRole = createServerFn({ method: 'POST' })
  .inputValidator(setUserRoleSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.ROLES_ASSIGN,
    )

    const headers = getRequestHeaders()
    await auth.api.setRole({
      headers,
      body: {
        userId: data.userId,
        role: data.role,
      },
    })

    await UserService.createAuditLog({
      userId: sessionUser.id,
      targetUserId: data.userId,
      action: 'role_assigned',
      resource: 'users',
      resourceId: data.userId,
      details: JSON.stringify({ role: data.role }),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })

    const userRoleValues = Array.isArray(data.role) ? data.role : [data.role]
    for (const roleName of userRoleValues) {
      const roleId = await RBACService.getRoleIdByName(roleName)
      if (!roleId) {
        continue
      }

      await RBACService.assignRoleIfMissing({
        userId: data.userId,
        roleId,
        assignedBy: sessionUser.id,
      })
    }

    return { success: true }
  })
