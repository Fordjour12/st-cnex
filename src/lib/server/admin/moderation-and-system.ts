import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { PERMISSIONS } from '@/lib/permissions'
import { requireAdminPermission } from '@/lib/server/admin/security'
import { Phase4ModerationService, Phase4SystemService } from '@/lib/server/moderation-and-system'

export const getAdminModerationOverview = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminPermission(PERMISSIONS.REPORTS_REVIEW)
  return Phase4ModerationService.getModerationOverview()
})

const calculateRiskSchema = z.object({
  userId: z.string(),
})

export const calculateUserRisk = createServerFn({ method: 'POST' })
  .inputValidator(calculateRiskSchema)
  .handler(async ({ data }) => {
    await requireAdminPermission(PERMISSIONS.REPORTS_REVIEW)
    return Phase4ModerationService.calculateRiskForUser(data.userId)
  })

const evaluateRulesSchema = z.object({
  userId: z.string(),
})

export const evaluateModerationRules = createServerFn({ method: 'POST' })
  .inputValidator(evaluateRulesSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.REPORTS_REVIEW,
    )
    return Phase4ModerationService.evaluateRulesForUser(data.userId, sessionUser.id)
  })

const issueWarningSchema = z.object({
  userId: z.string(),
  warningType: z.enum(['conduct', 'spam', 'fraud', 'policy']),
  message: z.string().min(5),
  expiresAt: z.coerce.date().optional(),
})

export const issueUserWarning = createServerFn({ method: 'POST' })
  .inputValidator(issueWarningSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.REPORTS_REVIEW,
    )

    return Phase4ModerationService.issueWarning({
      ...data,
      issuedBy: sessionUser.id,
    })
  })

const createFlagSchema = z.object({
  userId: z.string(),
  flagType: z.string().min(2),
  reason: z.string().min(5),
  severity: z.number().int().min(1).max(5),
})

export const createFraudFlag = createServerFn({ method: 'POST' })
  .inputValidator(createFlagSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.REPORTS_REVIEW,
    )

    return Phase4ModerationService.createFraudFlag({
      ...data,
      createdBy: sessionUser.id,
    })
  })

const resolveFlagSchema = z.object({
  flagId: z.number().int().positive(),
})

export const resolveFraudFlag = createServerFn({ method: 'POST' })
  .inputValidator(resolveFlagSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.REPORTS_REVIEW,
    )

    return Phase4ModerationService.resolveFraudFlag({
      flagId: data.flagId,
      resolvedBy: sessionUser.id,
    })
  })

export const getAdminSystemOverview = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminPermission(PERMISSIONS.SYSTEM_SETTINGS)
  return Phase4SystemService.getSystemOverview()
})

const upsertSettingSchema = z.object({
  key: z.string().min(2),
  value: z.string(),
  description: z.string().optional(),
})

export const upsertSystemSetting = createServerFn({ method: 'POST' })
  .inputValidator(upsertSettingSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.SYSTEM_SETTINGS,
    )

    return Phase4SystemService.upsertSystemSetting({
      ...data,
      updatedBy: sessionUser.id,
    })
  })

const upsertToggleSchema = z.object({
  key: z.string().min(2),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
  description: z.string().optional(),
})

export const upsertFeatureToggle = createServerFn({ method: 'POST' })
  .inputValidator(upsertToggleSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.SYSTEM_SETTINGS,
    )

    return Phase4SystemService.upsertFeatureToggle({
      ...data,
      updatedBy: sessionUser.id,
    })
  })

const createAnnouncementSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(5),
  type: z.enum(['info', 'warning', 'critical']),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
})

export const createAnnouncement = createServerFn({ method: 'POST' })
  .inputValidator(createAnnouncementSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.SYSTEM_SETTINGS,
    )

    return Phase4SystemService.createAnnouncement({
      ...data,
      createdBy: sessionUser.id,
    })
  })

const upsertTemplateSchema = z.object({
  key: z.string().min(2),
  subject: z.string().min(2),
  body: z.string().min(5),
})

export const upsertEmailTemplate = createServerFn({ method: 'POST' })
  .inputValidator(upsertTemplateSchema)
  .handler(async ({ data }) => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.SYSTEM_SETTINGS,
    )

    return Phase4SystemService.upsertEmailTemplate({
      ...data,
      updatedBy: sessionUser.id,
    })
  })

export const initializePhase4Defaults = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { user: sessionUser } = await requireAdminPermission(
      PERMISSIONS.SYSTEM_SETTINGS,
    )
    return Phase4SystemService.createDefaultRulesAndSettings(sessionUser.id)
  },
)
