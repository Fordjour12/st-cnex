import { createServerFn } from '@tanstack/react-start'

import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { PermissionAuditService } from '@/lib/server/permission-audit'
import { UserService } from '@/lib/server/user'

export const getPermissionAuditReport = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { user, metadata } = await requireAdminPermission(
      PERMISSIONS.AUDIT_LOGS_VIEW,
    )
    const report = await PermissionAuditService.generateReport()

    await UserService.createAuditLog({
      userId: user.id,
      action: 'role_assigned',
      resource: 'permission_audit',
      details: JSON.stringify({
        usersWithDrift: report.summary.usersWithDrift,
        rolesWithDrift: report.summary.rolesWithDrift,
      }),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })

    return report
  },
)
