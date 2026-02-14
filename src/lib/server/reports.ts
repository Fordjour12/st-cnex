import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { auditLogs, reports } from '@/db/schema/rbac'

type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
type ReportType = 'user' | 'message' | 'profile' | 'content'

export class ReportService {
  static async getReports(params: {
    page?: number
    limit?: number
    search?: string
    status?: ReportStatus | 'all'
    sortOrder?: 'asc' | 'desc'
  }) {
    const { page = 1, limit = 20, search, status = 'all', sortOrder = 'desc' } = params
    const offset = (page - 1) * limit
    const orderFn = sortOrder === 'desc' ? desc : asc

    const whereClause = and(
      status !== 'all' ? eq(reports.status, status) : undefined,
      search
        ? or(
            ilike(reports.reason, `%${search}%`),
            ilike(reports.description, `%${search}%`),
            ilike(reports.reportedUserId, `%${search}%`),
          )
        : undefined,
    )

    const rows = await db
      .select()
      .from(reports)
      .where(whereClause)
      .orderBy(orderFn(reports.createdAt))
      .limit(limit)
      .offset(offset)

    const [{ total }] = await db
      .select({ total: count() })
      .from(reports)
      .where(whereClause)

    return {
      reports: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }

  static async getReportById(reportId: number) {
    const [result] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1)

    return result
  }

  static async markReviewing(params: {
    reportId: number
    reviewedBy: string
    ipAddress?: string
    userAgent?: string
  }) {
    const { reportId, reviewedBy, ipAddress, userAgent } = params

    await db
      .update(reports)
      .set({
        status: 'reviewing',
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))

    await this.createAuditLog({
      userId: reviewedBy,
      action: 'report_resolved',
      resource: 'reports',
      resourceId: String(reportId),
      details: JSON.stringify({ status: 'reviewing' }),
      ipAddress,
      userAgent,
    })

    return { success: true }
  }

  static async resolveReport(params: {
    reportId: number
    reviewedBy: string
    resolution: string
    status: 'resolved' | 'dismissed'
    ipAddress?: string
    userAgent?: string
  }) {
    const { reportId, reviewedBy, resolution, status, ipAddress, userAgent } =
      params

    await db
      .update(reports)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        resolution,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))

    await this.createAuditLog({
      userId: reviewedBy,
      action: 'report_resolved',
      resource: 'reports',
      resourceId: String(reportId),
      details: JSON.stringify({ status, resolution }),
      ipAddress,
      userAgent,
    })

    return { success: true }
  }

  static async createReport(params: {
    reporterId?: string
    reportedUserId: string
    reportType: ReportType
    reason: string
    description?: string
  }) {
    const { reporterId, reportedUserId, reportType, reason, description } = params

    const [created] = await db
      .insert(reports)
      .values({
        reporterId,
        reportedUserId,
        reportType,
        reason,
        description,
      })
      .returning()

    return created
  }

  private static async createAuditLog(params: {
    userId?: string
    targetUserId?: string
    action: 'report_resolved'
    resource: string
    resourceId?: string
    details?: string
    ipAddress?: string
    userAgent?: string
  }) {
    const {
      userId,
      targetUserId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    } = params

    await db.insert(auditLogs).values({
      userId,
      targetUserId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      createdAt: sql`NOW()`,
    })
  }
}
