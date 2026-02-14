import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { user } from '@/db/schema/auth'
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@/db/schema/rbac'
import { ROLE_PERMISSIONS } from '@/lib/permissions'

type RoleName = keyof typeof ROLE_PERMISSIONS

interface UserPermissionDrift {
  userId: string
  email: string
  roles: Array<string>
  expectedPermissions: Array<string>
  actualPermissions: Array<string>
  missingPermissions: Array<string>
  extraPermissions: Array<string>
}

interface RolePermissionDrift {
  role: string
  expectedPermissions: Array<string>
  actualPermissions: Array<string>
  missingPermissions: Array<string>
  extraPermissions: Array<string>
}

export interface PermissionAuditReport {
  generatedAt: string
  summary: {
    usersScanned: number
    usersWithDrift: number
    rolesScanned: number
    rolesWithDrift: number
    unknownRoles: Array<string>
  }
  userDrift: Array<UserPermissionDrift>
  roleDrift: Array<RolePermissionDrift>
}

function uniqueSorted(values: Array<string>) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function setDifference(left: Set<string>, right: Set<string>) {
  return Array.from(left).filter((item) => !right.has(item))
}

function knownRolePermissions(role: string): Array<string> {
  if (!(role in ROLE_PERMISSIONS)) {
    return []
  }

  return ROLE_PERMISSIONS[role as RoleName]
}

export class PermissionAuditService {
  static async generateReport(): Promise<PermissionAuditReport> {
    const [assignedRoles, assignedPermissions, configuredRoles] =
      await Promise.all([
        db
          .select({
            userId: userRoles.userId,
            email: user.email,
            roleName: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .innerJoin(user, eq(user.id, userRoles.userId)),
        db
          .select({
            userId: userRoles.userId,
            permissionName: permissions.name,
          })
          .from(userRoles)
          .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)),
        db.select({ roleName: roles.name }).from(roles),
      ])

    const userRoleMap = new Map<
      string,
      { email: string; roles: Set<string>; actualPermissions: Set<string> }
    >()

    for (const row of assignedRoles) {
      const current = userRoleMap.get(row.userId) ?? {
        email: row.email,
        roles: new Set<string>(),
        actualPermissions: new Set<string>(),
      }
      current.roles.add(row.roleName)
      userRoleMap.set(row.userId, current)
    }

    for (const row of assignedPermissions) {
      const current = userRoleMap.get(row.userId)
      if (!current) {
        continue
      }
      current.actualPermissions.add(row.permissionName)
    }

    const userDrift: Array<UserPermissionDrift> = []
    const unknownRoleSet = new Set<string>()

    for (const [userId, entry] of userRoleMap.entries()) {
      const expectedPermissions = new Set<string>()

      for (const role of entry.roles) {
        const expected = knownRolePermissions(role)
        if (expected.length === 0 && !(role in ROLE_PERMISSIONS)) {
          unknownRoleSet.add(role)
          continue
        }
        for (const permission of expected) {
          expectedPermissions.add(permission)
        }
      }

      const missingPermissions = uniqueSorted(
        setDifference(expectedPermissions, entry.actualPermissions),
      )
      const extraPermissions = uniqueSorted(
        setDifference(entry.actualPermissions, expectedPermissions),
      )

      if (missingPermissions.length === 0 && extraPermissions.length === 0) {
        continue
      }

      userDrift.push({
        userId,
        email: entry.email,
        roles: uniqueSorted(Array.from(entry.roles)),
        expectedPermissions: uniqueSorted(Array.from(expectedPermissions)),
        actualPermissions: uniqueSorted(Array.from(entry.actualPermissions)),
        missingPermissions,
        extraPermissions,
      })
    }

    const rolePermissionRows = await db
      .select({
        roleName: roles.name,
        permissionName: permissions.name,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))

    const roleToPermissions = new Map<string, Set<string>>()
    for (const row of rolePermissionRows) {
      const current = roleToPermissions.get(row.roleName) ?? new Set<string>()
      if (row.permissionName) {
        current.add(row.permissionName)
      }
      roleToPermissions.set(row.roleName, current)
    }

    const roleDrift: Array<RolePermissionDrift> = []
    for (const row of configuredRoles) {
      const roleName = row.roleName
      const actualPermissions = roleToPermissions.get(roleName) ?? new Set<string>()
      const expectedPermissions = new Set<string>(knownRolePermissions(roleName))

      if (!(roleName in ROLE_PERMISSIONS)) {
        unknownRoleSet.add(roleName)
        continue
      }

      const missingPermissions = uniqueSorted(
        setDifference(expectedPermissions, actualPermissions),
      )
      const extraPermissions = uniqueSorted(
        setDifference(actualPermissions, expectedPermissions),
      )

      if (missingPermissions.length === 0 && extraPermissions.length === 0) {
        continue
      }

      roleDrift.push({
        role: roleName,
        expectedPermissions: uniqueSorted(Array.from(expectedPermissions)),
        actualPermissions: uniqueSorted(Array.from(actualPermissions)),
        missingPermissions,
        extraPermissions,
      })
    }

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        usersScanned: userRoleMap.size,
        usersWithDrift: userDrift.length,
        rolesScanned: configuredRoles.length,
        rolesWithDrift: roleDrift.length,
        unknownRoles: uniqueSorted(Array.from(unknownRoleSet)),
      },
      userDrift,
      roleDrift,
    }
  }
}
