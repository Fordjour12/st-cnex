import { and, asc, count, desc, eq, isNull, or } from 'drizzle-orm'

import { db } from '@/db'
import {
  emailTemplates,
  featureToggles,
  fraudFlags,
  moderationRules,
  platformAnnouncements,
  systemSettings,
  userRiskProfiles,
  userWarnings,
} from '@/db/schema/moderation-and-system'
import { reports, userSuspensions } from '@/db/schema/rbac'

type RiskLevel = 'low' | 'medium' | 'high'

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export class Phase4ModerationService {
  static async calculateRiskForUser(userId: string) {
    const [activeSuspensions] = await db
      .select({ total: count() })
      .from(userSuspensions)
      .where(and(eq(userSuspensions.userId, userId), isNull(userSuspensions.liftedAt)))

    const [allReports] = await db
      .select({ total: count() })
      .from(reports)
      .where(eq(reports.reportedUserId, userId))

    const [openReports] = await db
      .select({ total: count() })
      .from(reports)
      .where(
        and(
          eq(reports.reportedUserId, userId),
          or(eq(reports.status, 'pending'), eq(reports.status, 'reviewing')),
        ),
      )

    const score = Math.min(100, activeSuspensions.total * 30 + openReports.total * 15 + allReports.total * 5)
    const riskLevel = riskLevelFromScore(score)

    const factors = {
      activeSuspensions: activeSuspensions.total,
      openReports: openReports.total,
      allReports: allReports.total,
    }

    await db
      .insert(userRiskProfiles)
      .values({
        userId,
        riskScore: score,
        riskLevel,
        factors: JSON.stringify(factors),
      })
      .onConflictDoUpdate({
        target: userRiskProfiles.userId,
        set: {
          riskScore: score,
          riskLevel,
          factors: JSON.stringify(factors),
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        },
      })

    return {
      userId,
      riskScore: score,
      riskLevel,
      factors,
    }
  }

  static async evaluateRulesForUser(userId: string, actorUserId: string) {
    const risk = await this.calculateRiskForUser(userId)
    const rules = await db
      .select()
      .from(moderationRules)
      .where(eq(moderationRules.enabled, true))
      .orderBy(desc(moderationRules.threshold))

    const triggered: Array<{ ruleId: number; name: string }> = []

    for (const rule of rules) {
      if (risk.riskScore >= rule.threshold && rule.action === 'flag_fraud') {
        await db.insert(fraudFlags).values({
          userId,
          flagType: 'auto_rule',
          reason: `Triggered rule "${rule.name}" at score ${risk.riskScore}`,
          severity: 3,
          status: 'open',
          createdBy: actorUserId,
        })

        triggered.push({ ruleId: rule.id, name: rule.name })
      }
    }

    return {
      risk,
      triggered,
    }
  }

  static async createFraudFlag(params: {
    userId: string
    flagType: string
    reason: string
    severity: number
    createdBy: string
  }) {
    const [created] = await db
      .insert(fraudFlags)
      .values({
        ...params,
      })
      .returning()

    return created
  }

  static async resolveFraudFlag(params: { flagId: number; resolvedBy: string }) {
    await db
      .update(fraudFlags)
      .set({
        status: 'resolved',
        resolvedBy: params.resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(fraudFlags.id, params.flagId))

    return { success: true }
  }

  static async issueWarning(params: {
    userId: string
    warningType: 'conduct' | 'spam' | 'fraud' | 'policy'
    message: string
    issuedBy: string
    expiresAt?: Date
  }) {
    const [created] = await db
      .insert(userWarnings)
      .values({
        ...params,
      })
      .returning()

    return created
  }

  static async getModerationOverview() {
    const [openFlags] = await db
      .select({ total: count() })
      .from(fraudFlags)
      .where(or(eq(fraudFlags.status, 'open'), eq(fraudFlags.status, 'investigating')))

    const [highRiskUsers] = await db
      .select({ total: count() })
      .from(userRiskProfiles)
      .where(eq(userRiskProfiles.riskLevel, 'high'))

    const recentFlags = await db.select().from(fraudFlags).orderBy(desc(fraudFlags.createdAt)).limit(10)
    const recentWarnings = await db
      .select()
      .from(userWarnings)
      .orderBy(desc(userWarnings.issuedAt))
      .limit(10)

    return {
      stats: {
        openFlags: openFlags.total,
        highRiskUsers: highRiskUsers.total,
      },
      recentFlags,
      recentWarnings,
    }
  }
}

export class Phase4SystemService {
  static async getSystemOverview() {
    const settings = await db.select().from(systemSettings).orderBy(asc(systemSettings.key))
    const toggles = await db.select().from(featureToggles).orderBy(asc(featureToggles.key))
    const announcements = await db
      .select()
      .from(platformAnnouncements)
      .orderBy(desc(platformAnnouncements.createdAt))
      .limit(20)
    const templates = await db.select().from(emailTemplates).orderBy(asc(emailTemplates.key))

    return {
      settings,
      toggles,
      announcements,
      templates,
    }
  }

  static async upsertSystemSetting(params: {
    key: string
    value: string
    description?: string
    updatedBy: string
  }) {
    await db
      .insert(systemSettings)
      .values({
        ...params,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: params.value,
          description: params.description,
          updatedBy: params.updatedBy,
          updatedAt: new Date(),
        },
      })

    return { success: true }
  }

  static async upsertFeatureToggle(params: {
    key: string
    enabled: boolean
    rolloutPercentage: number
    description?: string
    updatedBy: string
  }) {
    await db
      .insert(featureToggles)
      .values({
        ...params,
      })
      .onConflictDoUpdate({
        target: featureToggles.key,
        set: {
          enabled: params.enabled,
          rolloutPercentage: params.rolloutPercentage,
          description: params.description,
          updatedBy: params.updatedBy,
          updatedAt: new Date(),
        },
      })

    return { success: true }
  }

  static async createAnnouncement(params: {
    title: string
    message: string
    type: 'info' | 'warning' | 'critical'
    createdBy: string
    startsAt?: Date
    endsAt?: Date
  }) {
    const [created] = await db
      .insert(platformAnnouncements)
      .values({
        ...params,
      })
      .returning()

    return created
  }

  static async upsertEmailTemplate(params: {
    key: string
    subject: string
    body: string
    updatedBy: string
  }) {
    await db
      .insert(emailTemplates)
      .values({
        ...params,
      })
      .onConflictDoUpdate({
        target: emailTemplates.key,
        set: {
          subject: params.subject,
          body: params.body,
          updatedBy: params.updatedBy,
          updatedAt: new Date(),
        },
      })

    return { success: true }
  }

  static async createDefaultRulesAndSettings(actorUserId: string) {
    await db
      .insert(moderationRules)
      .values([
        {
          name: 'High Risk Auto Flag',
          description: 'Auto-create fraud flag when risk score >= 75',
          threshold: 75,
          action: 'flag_fraud',
        },
      ])
      .onConflictDoNothing()

    await this.upsertSystemSetting({
      key: 'maintenance_mode',
      value: 'off',
      description: 'Global maintenance switch',
      updatedBy: actorUserId,
    })

    await this.upsertFeatureToggle({
      key: 'phase4_moderation',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Enable Phase 4 moderation features',
      updatedBy: actorUserId,
    })

    await this.upsertEmailTemplate({
      key: 'warning_notice',
      subject: 'Account Warning',
      body: 'Your account has received a policy warning.',
      updatedBy: actorUserId,
    })

    return { success: true }
  }

}
