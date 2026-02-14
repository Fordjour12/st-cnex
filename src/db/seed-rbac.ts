import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/permissions'
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@/db/schema/rbac'
import { user } from '@/db/schema/auth'

type RoleName = keyof typeof ROLE_PERMISSIONS

function splitPermissionName(permission: string) {
  const [resource, action] = permission.split('.')

  return {
    resource,
    action,
  }
}

async function ensurePermission(permissionName: string) {
  const { resource, action } = splitPermissionName(permissionName)

  await db
    .insert(permissions)
    .values({
      name: permissionName,
      resource,
      action,
      description: `${resource} ${action} permission`,
    })
    .onConflictDoNothing()

  const results = await db
    .select()
    .from(permissions)
    .where(eq(permissions.name, permissionName))
    .limit(1)

  return results[0]
}

async function ensureRole(roleName: RoleName) {
  await db
    .insert(roles)
    .values({
      name: roleName,
      description: `${roleName} role`,
    })
    .onConflictDoNothing()

  const results = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1)
  return results[0]
}

async function ensureRolePermission(roleId: number, permissionId: number) {
  await db.insert(rolePermissions).values({
    roleId,
    permissionId,
  }).onConflictDoNothing()
}

async function ensureAdminUserAssignment(adminEmail: string) {
  const userResults = await db
    .select()
    .from(user)
    .where(eq(user.email, adminEmail))
    .limit(1)
  const existingUser = userResults[0]

  if (userResults.length === 0) {
    console.log(`Admin user not found for email "${adminEmail}".`)
    console.log('Create the user account first, then rerun this seed script.')
    return
  }

  const roleResults = await db
    .select()
    .from(roles)
    .where(eq(roles.name, 'super_admin'))
    .limit(1)
  const superAdminRole = roleResults[0]

  if (roleResults.length === 0) {
    throw new Error('Missing super_admin role after seeding.')
  }

  await db.insert(userRoles).values({
    userId: existingUser.id,
    roleId: superAdminRole.id,
    assignedBy: existingUser.id,
  }).onConflictDoNothing()

  console.log(`Ensured super_admin role assignment for ${adminEmail}.`)
}

async function main() {
  const allPermissions = Object.values(PERMISSIONS)
  const permissionIdsByName = new Map<string, number>()

  for (const permissionName of allPermissions) {
    const permission = await ensurePermission(permissionName)
    permissionIdsByName.set(permission.name, permission.id)
  }

  const roleNames = Object.keys(ROLE_PERMISSIONS) as Array<RoleName>

  for (const roleName of roleNames) {
    const role = await ensureRole(roleName)
    const permissionNames = ROLE_PERMISSIONS[roleName]

    for (const permissionName of permissionNames) {
      const permissionId = permissionIdsByName.get(permissionName) as number
      await ensureRolePermission(role.id, permissionId)
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    await ensureAdminUserAssignment(adminEmail)
  }

  console.log('RBAC seed completed.')
}

void main()
  .catch((error: unknown) => {
    console.error('RBAC seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$client.end()
  })
