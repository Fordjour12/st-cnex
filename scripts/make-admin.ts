import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { user } from '@/db/schema/auth'
import { roles, userRoles } from '@/db/schema/rbac'

const email = process.argv[2]
if (!email) {
  console.error('Usage: pnpm tsx scripts/make-admin.ts user@example.com')
  process.exit(1)
}

async function main() {
  const adminRoleArray = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'admin'))
    .limit(1)

  if (adminRoleArray.length === 0) {
    console.error(
      'Error: admin role not found in database. Run RBAC seed first.',
    )
    process.exit(1)
  }

  const adminRole = adminRoleArray[0]

  const userRecords = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (userRecords.length === 0) {
    console.error(`Error: User with email ${email} not found`)
    process.exit(1)
  }

  const userRecord = userRecords[0]

  await db.insert(userRoles).values({
    userId: userRecord.id,
    roleId: adminRole.id,
  })

  console.log(`Promoted ${email} to admin`)
}

main()
