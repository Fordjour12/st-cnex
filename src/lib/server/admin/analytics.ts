import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { AnalyticsService } from '@/lib/server/analytics'

const analyticsRangeSchema = z.object({
  days: z.number().int().min(7).max(365).optional().default(30),
})

export const getAdminAnalyticsDashboard = createServerFn({ method: 'GET' })
  .inputValidator(analyticsRangeSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.ANALYTICS_VIEW)

    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - data.days)

    const [stats, verificationStats, growth, dauMau, activeUsersTrend] = await Promise.all([
      AnalyticsService.getPlatformStats(),
      AnalyticsService.getInvestorVerificationStats(),
      AnalyticsService.getUserGrowth({
        startDate,
        endDate,
        interval: 'day',
      }),
      AnalyticsService.getDauMauStats(),
      AnalyticsService.getDailyActiveUsers({
        startDate,
        endDate,
      }),
    ])

    return {
      stats,
      verificationStats,
      growth,
      dauMau,
      activeUsersTrend,
      range: {
        days: data.days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }
  })

export const exportAdminAnalyticsCsv = createServerFn({ method: 'GET' })
  .inputValidator(analyticsRangeSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.ANALYTICS_VIEW)

    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - data.days)

    const [stats, verificationStats, growth, dauMau, activeUsersTrend] = await Promise.all([
      AnalyticsService.getPlatformStats(),
      AnalyticsService.getInvestorVerificationStats(),
      AnalyticsService.getUserGrowth({
        startDate,
        endDate,
        interval: 'day',
      }),
      AnalyticsService.getDauMauStats(),
      AnalyticsService.getDailyActiveUsers({
        startDate,
        endDate,
      }),
    ])

    const generatedAt = new Date().toISOString()

    const rows: Array<string> = []
    rows.push('section,metric,value')
    rows.push(`summary,total_users,${stats.totalUsers}`)
    rows.push(`summary,total_founders,${stats.totalFounders}`)
    rows.push(`summary,total_investors,${stats.totalInvestors}`)
    rows.push(`summary,total_talent,${stats.totalTalent}`)
    rows.push(`summary,pending_reports,${stats.pendingReports}`)
    rows.push(`summary,verified_investors,${stats.verifiedInvestors}`)
    rows.push(`summary,dau,${dauMau.dau}`)
    rows.push(`summary,mau,${dauMau.mau}`)
    rows.push('')

    rows.push('verification_status,count')
    for (const item of verificationStats) {
      rows.push(`${item.status},${item.count}`)
    }
    rows.push('')

    rows.push('growth_date,new_users')
    for (const point of growth) {
      rows.push(`${point.date},${point.count}`)
    }
    rows.push('')

    rows.push('active_date,active_users')
    for (const point of activeUsersTrend) {
      rows.push(`${point.date},${point.uniqueUsers}`)
    }

    const filename = `analytics-${data.days}d-${generatedAt.slice(0, 10)}.csv`
    return {
      filename,
      contentType: 'text/csv',
      csv: rows.join('\n'),
    }
  })
