import 'dotenv/config'

import { db } from '@/db'
import { PermissionAuditService } from '@/lib/server/permission-audit'

async function main() {
  const report = await PermissionAuditService.generateReport()
  const failOnDrift = process.argv.includes('--fail-on-drift')

  console.log(JSON.stringify(report, null, 2))

  if (
    failOnDrift &&
    (report.summary.usersWithDrift > 0 || report.summary.rolesWithDrift > 0)
  ) {
    process.exitCode = 1
  }
}

void main()
  .catch((error: unknown) => {
    console.error('Permission audit failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$client.end()
  })
