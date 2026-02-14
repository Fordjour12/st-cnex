import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { investorProfiles } from '@/db/schema/profile'
import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { UserService } from '@/lib/server/user'

const verifyInvestorSchema = z.object({
  userId: z.string(),
  status: z.enum(['verified', 'rejected']),
})

export const verifyInvestor = createServerFn({ method: 'POST' })
  .inputValidator(verifyInvestorSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.INVESTORS_VERIFY,
    )

    const now = new Date()

    await db
      .update(investorProfiles)
      .set(
        data.status === 'verified'
          ? {
              verificationStatus: 'verified' as const,
              verifiedAt: now,
              verifiedBy: sessionUser.id,
            }
          : {
              verificationStatus: 'rejected' as const,
            },
      )
      .where(eq(investorProfiles.userId, data.userId))

    await UserService.createAuditLog({
      userId: sessionUser.id,
      targetUserId: data.userId,
      action: 'user_verified',
      resource: 'investors',
      resourceId: data.userId,
      details: JSON.stringify({ status: data.status }),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })

    return { success: true }
  })
