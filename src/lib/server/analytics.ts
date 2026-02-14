import { db } from '@/db'
import { user } from '@/db/schema/auth'
import {
  founderProfiles,
  investorProfiles,
  talentProfiles,
} from '@/db/schema/profile'
import { reports, auditLogs } from '@/db/schema/rbac'
import { sql, and, gte, lte, eq, desc } from 'drizzle-orm'

export interface PlatformStats {
  totalUsers: number
  totalFounders: number
  totalInvestors: number
  totalTalent: number
  pendingReports: number
  verifiedInvestors: number
}

export interface UserGrowthData {
  date: string
  count: number
}

export interface ActiveUsersData {
  date: string
  uniqueUsers: number
}

export interface VerificationStats {
  status: 'pending' | 'verified' | 'rejected'
  count: number
}

export class AnalyticsService {
  static async getPlatformStats(): Promise<PlatformStats> {
    const [
      totalUsersResult,
      totalFoundersResult,
      totalInvestorsResult,
      totalTalentResult,
      pendingReportsResult,
      verifiedInvestorsResult,
    ] = await Promise.all([
      db.select({ totalUsers: sql<number>`count(*)::int` }).from(user),
      db
        .select({ totalFounders: sql<number>`count(*)::int` })
        .from(founderProfiles),
      db
        .select({ totalInvestors: sql<number>`count(*)::int` })
        .from(investorProfiles),
      db
        .select({ totalTalent: sql<number>`count(*)::int` })
        .from(talentProfiles),
      db
        .select({ pendingReports: sql<number>`count(*)::int` })
        .from(reports)
        .where(eq(reports.status, 'pending')),
      db
        .select({ verifiedInvestors: sql<number>`count(*)::int` })
        .from(investorProfiles)
        .where(eq(investorProfiles.verificationStatus, 'verified')),
    ])

    return {
      totalUsers: totalUsersResult[0]?.totalUsers ?? 0,
      totalFounders: totalFoundersResult[0]?.totalFounders ?? 0,
      totalInvestors: totalInvestorsResult[0]?.totalInvestors ?? 0,
      totalTalent: totalTalentResult[0]?.totalTalent ?? 0,
      pendingReports: pendingReportsResult[0]?.pendingReports ?? 0,
      verifiedInvestors: verifiedInvestorsResult[0]?.verifiedInvestors ?? 0,
    }
  }

  static async getUserGrowth(params: {
    startDate: Date
    endDate: Date
    interval?: 'day' | 'week' | 'month'
  }): Promise<UserGrowthData[]> {
    const { startDate, endDate, interval = 'day' } = params

    const result = await db
      .select({
        date: sql<string>`date_trunc(${interval}, ${user.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(user)
      .where(and(gte(user.createdAt, startDate), lte(user.createdAt, endDate)))
      .groupBy(sql`date_trunc(${interval}, ${user.createdAt})`)
      .orderBy(sql`date_trunc(${interval}, ${user.createdAt})`)

    return result.map((r) => ({
      date: r.date.toString(),
      count: r.count,
    }))
  }

  static async getInvestorVerificationStats(): Promise<VerificationStats[]> {
    const result = await db
      .select({
        status: investorProfiles.verificationStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(investorProfiles)
      .groupBy(investorProfiles.verificationStatus)

    return result.map((r) => ({
      status: r.status as 'pending' | 'verified' | 'rejected',
      count: r.count,
    }))
  }

  static async getRecentAuditLogs(params: { limit?: number }): Promise<
    {
      id: string
      userId: string | null
      targetUserId: string | null
      action: string
      resource: string
      details: string | null
      createdAt: Date
    }[]
  > {
    const { limit = 50 } = params

    const result = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)

    return result.map((r) => ({
      id: r.id.toString(),
      userId: r.userId,
      targetUserId: r.targetUserId,
      action: r.action,
      resource: r.resource,
      details: r.details,
      createdAt: r.createdAt,
    }))
  }

  static async getNewSignups(params: { days: number }): Promise<number> {
    const { days } = params
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(gte(user.createdAt, since))

    return result?.count ?? 0
  }
}
