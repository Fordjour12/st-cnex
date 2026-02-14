import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { ReportService } from '@/lib/server/reports'

const getReportsSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  search: z.string().optional(),
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed', 'all']).optional().default('all'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const getAdminReports = createServerFn({ method: 'GET' })
  .inputValidator(getReportsSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.REPORTS_VIEW)
    return ReportService.getReports(data)
  })

const getReportByIdSchema = z.object({
  reportId: z.number().int().positive(),
})

export const getAdminReportById = createServerFn({ method: 'GET' })
  .inputValidator(getReportByIdSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.REPORTS_VIEW)
    return ReportService.getReportById(data.reportId)
  })

const markReviewingSchema = z.object({
  reportId: z.number().int().positive(),
})

export const reviewAdminReport = createServerFn({ method: 'POST' })
  .inputValidator(markReviewingSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.REPORTS_REVIEW,
    )

    return ReportService.markReviewing({
      reportId: data.reportId,
      reviewedBy: sessionUser.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })
  })

const resolveReportSchema = z.object({
  reportId: z.number().int().positive(),
  status: z.enum(['resolved', 'dismissed']),
  resolution: z.string().min(5),
})

export const resolveAdminReport = createServerFn({ method: 'POST' })
  .inputValidator(resolveReportSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser, metadata } = await requireAdminPermission(
      PERMISSIONS.REPORTS_RESOLVE,
    )

    return ReportService.resolveReport({
      reportId: data.reportId,
      reviewedBy: sessionUser.id,
      status: data.status,
      resolution: data.resolution,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })
  })
