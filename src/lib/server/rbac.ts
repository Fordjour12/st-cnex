import { db } from '@/db'
import {
  userRoles,
  roles,
  rolePermissions,
  permissions,
} from '@/db/schema/rbac'
import { and, eq } from 'drizzle-orm'
import { type Permission } from '@/lib/permissions'

export class RBACService {
  static async getUserPermissions(userId: string): Promise<Permission[]> {
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
    perms: Permission[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return perms.some((p) => userPermissions.includes(p))
  }

  static async hasAllPermissions(
    userId: string,
    perms: Permission[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return perms.every((p) => userPermissions.includes(p))
  }

  static async getUserRoles(userId: string): Promise<string[]> {
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

  static async removeRole(params: { userId: string; roleId: number }) {
    const { userId, roleId } = params
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
  }
}
