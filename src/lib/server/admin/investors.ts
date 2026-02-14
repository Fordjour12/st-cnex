import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, desc, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/db'
import { userWarnings } from '@/db/schema/moderation-and-system'
import { investorProfiles } from '@/db/schema/profile'
import { user } from '@/db/schema/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { UserService } from '@/lib/server/user'

const listInvestorsSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  status: z
    .enum(['pending', 'verified', 'rejected', 'all'])
    .optional()
    .default('pending'),
  investorType: z.string().optional().default(''),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
})

export const listInvestorVerifications = createServerFn({ method: 'GET' })
  .inputValidator(listInvestorsSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.INVESTORS_VERIFY)

    const conditions = []

    if (data.status && data.status !== 'all') {
      conditions.push(eq(investorProfiles.verificationStatus, data.status))
    }

    if (data.investorType) {
      conditions.push(eq(investorProfiles.investorType, data.investorType))
    }

    if (data.dateFrom) {
      conditions.push(gte(investorProfiles.createdAt, new Date(data.dateFrom)))
    }

    if (data.dateTo) {
      conditions.push(lte(investorProfiles.createdAt, new Date(data.dateTo)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
    const offset = (data.page - 1) * data.limit

    const [investors, countResult] = await Promise.all([
      db
        .select({
          userId: investorProfiles.userId,
          investorType: investorProfiles.investorType,
          investmentRangeMin: investorProfiles.investmentRangeMin,
          investmentRangeMax: investorProfiles.investmentRangeMax,
          industriesOfInterest: investorProfiles.industriesOfInterest,
          verificationStatus: investorProfiles.verificationStatus,
          linkedinUrl: investorProfiles.linkedinUrl,
          portfolioUrl: investorProfiles.portfolio,
          createdAt: investorProfiles.createdAt,
          email: user.email,
          name: user.name,
        })
        .from(investorProfiles)
        .innerJoin(user, eq(investorProfiles.userId, user.id))
        .where(whereClause)
        .orderBy(desc(investorProfiles.createdAt))
        .limit(data.limit)
        .offset(offset),
      db
        .select({ count: investorProfiles.userId })
        .from(investorProfiles)
        .where(whereClause),
    ])

    return {
      investors,
      pagination: {
        page: data.page,
        limit: data.limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / data.limit),
      },
    }
  })

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

    await db.insert(userWarnings).values({
      userId: data.userId,
      warningType: 'policy',
      message:
        data.status === 'verified'
          ? 'Your investor verification has been approved.'
          : 'Your investor verification has been rejected. Please update your profile and re-submit.',
      issuedBy: sessionUser.id,
    })

    await UserService.createAuditLog({
      userId: sessionUser.id,
      targetUserId: data.userId,
      action: 'user_verified',
      resource: 'investors',
      resourceId: data.userId,
      details: JSON.stringify({ status: data.status, notificationSent: true }),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })

    return { success: true }
  })
