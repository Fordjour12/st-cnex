import { and, eq } from 'drizzle-orm'
import type { Permission } from '@/lib/permissions'

import { db } from '@/db'
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@/db/schema/rbac'

export class RBACService {
  static async getUserPermissions(userId: string): Promise<Array<Permission>> {
    const result = await db
      .select({
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))

    return result.map((r) => r.permissionName as Permission)
  }

  static async hasPermission(
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return userPermissions.includes(permission)
  }

  static async hasAnyPermission(
    userId: string,
    perms: Array<Permission>,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return perms.some((p) => userPermissions.includes(p))
  }

  static async hasAllPermissions(
    userId: string,
    perms: Array<Permission>,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return perms.every((p) => userPermissions.includes(p))
  }

  static async getUserRoles(userId: string): Promise<Array<string>> {
    const result = await db
      .select({
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    return result.map((r) => r.roleName)
  }

  static async isAdmin(userId: string): Promise<boolean> {
    const userRolesResult = await this.getUserRoles(userId)
    return userRolesResult.some((r) => r === 'admin' || r === 'super_admin')
  }

  static async isSuperAdmin(userId: string): Promise<boolean> {
    const userRolesResult = await this.getUserRoles(userId)
    return userRolesResult.includes('super_admin')
  }

  static async assignRole(params: {
    userId: string
    roleId: number
    assignedBy: string
  }) {
    const { userId, roleId, assignedBy } = params
    await db.insert(userRoles).values({
      userId,
      roleId,
      assignedBy,
    })
  }

  static async assignRoleIfMissing(params: {
    userId: string
    roleId: number
    assignedBy: string
  }) {
    const { userId, roleId, assignedBy } = params

    const matches = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1)

    if (matches.length > 0) {
      return
    }

    await db.insert(userRoles).values({
      userId,
      roleId,
      assignedBy,
    })
  }

  static async removeRole(params: { userId: string; roleId: number }) {
    const { userId, roleId } = params
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
  }

  static async setUserPrimaryRoleByName(params: {
    userId: string
    roleName: string
    assignedBy: string
  }) {
    const { userId, roleName, assignedBy } = params

    const matchingRoles = await db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1)

    if (matchingRoles.length === 0) {
      throw new Error('ROLE_NOT_FOUND')
    }
    const roleId = matchingRoles[0].id

    await db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId))
      await tx.insert(userRoles).values({
        userId,
        roleId,
        assignedBy,
      })
    })
  }

  static async getRoleIdByName(roleName: string): Promise<number | null> {
    const matches = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1)

    if (matches.length === 0) {
      return null
    }

    return matches[0].id
  }
}
