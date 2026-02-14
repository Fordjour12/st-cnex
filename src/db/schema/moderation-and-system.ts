import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high'])

export const fraudFlagStatusEnum = pgEnum('fraud_flag_status', [
  'open',
  'investigating',
  'resolved',
])

export const warningTypeEnum = pgEnum('warning_type', [
  'conduct',
  'spam',
  'fraud',
  'policy',
])

export const announcementTypeEnum = pgEnum('announcement_type', [
  'info',
  'warning',
  'critical',
])

export const userRiskProfiles = pgTable(
  'user_risk_profiles',
  {
    userId: varchar('user_id', { length: 255 }).primaryKey(),
    riskScore: integer('risk_score').notNull().default(0),
    riskLevel: riskLevelEnum('risk_level').notNull().default('low'),
    factors: text('factors'),
    lastCalculatedAt: timestamp('last_calculated_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    riskLevelIdx: index('user_risk_profiles_risk_level_idx').on(table.riskLevel),
  }),
)

export const fraudFlags = pgTable(
  'fraud_flags',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    flagType: varchar('flag_type', { length: 100 }).notNull(),
    reason: text('reason').notNull(),
    severity: integer('severity').notNull().default(1),
    status: fraudFlagStatusEnum('status').notNull().default('open'),
    createdBy: varchar('created_by', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedBy: varchar('resolved_by', { length: 255 }),
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => ({
    userIdIdx: index('fraud_flags_user_id_idx').on(table.userId),
    statusIdx: index('fraud_flags_status_idx').on(table.status),
  }),
)

export const userWarnings = pgTable(
  'user_warnings',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    warningType: warningTypeEnum('warning_type').notNull(),
    message: text('message').notNull(),
    issuedBy: varchar('issued_by', { length: 255 }).notNull(),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
    acknowledgedAt: timestamp('acknowledged_at'),
  },
  (table) => ({
    userIdIdx: index('user_warnings_user_id_idx').on(table.userId),
  }),
)

export const moderationRules = pgTable('moderation_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull().unique(),
  description: text('description'),
  enabled: boolean('enabled').notNull().default(true),
  threshold: integer('threshold').notNull().default(70),
  action: varchar('action', { length: 80 }).notNull().default('flag_fraud'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 120 }).primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const featureToggles = pgTable('feature_toggles', {
  key: varchar('key', { length: 120 }).primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').notNull().default(100),
  description: text('description'),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const platformAnnouncements = pgTable(
  'platform_announcements',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 160 }).notNull(),
    message: text('message').notNull(),
    type: announcementTypeEnum('type').notNull().default('info'),
    active: boolean('active').notNull().default(true),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    createdBy: varchar('created_by', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    activeIdx: index('platform_announcements_active_idx').on(table.active),
  }),
)

export const emailTemplates = pgTable('email_templates', {
  key: varchar('key', { length: 120 }).primaryKey(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
