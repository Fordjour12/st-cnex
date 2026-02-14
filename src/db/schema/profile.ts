import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'verified',
  'rejected',
])

export const profileTypeEnum = pgEnum('profile_type', [
  'founder',
  'investor',
  'talent',
])

export const founderProfiles = pgTable('founder_profiles', {
  userId: varchar('user_id', { length: 255 }).primaryKey(),
  startupName: varchar('startup_name', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  stage: varchar('stage', { length: 50 }),
  pitchDeckUrl: text('pitch_deck_url'),
  websiteUrl: text('website_url'),
  linkedinUrl: text('linkedin_url'),
  bio: text('bio'),
  tags: text('tags').array(),
  verified: boolean('verified').default(false).notNull(),
  verificationNotes: text('verification_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const investorProfiles = pgTable(
  'investor_profiles',
  {
    userId: varchar('user_id', { length: 255 }).primaryKey(),
    investorType: varchar('investor_type', { length: 50 }),
    investmentRangeMin: decimal('investment_range_min', {
      precision: 15,
      scale: 2,
    }),
    investmentRangeMax: decimal('investment_range_max', {
      precision: 15,
      scale: 2,
    }),
    industriesOfInterest: text('industries_of_interest').array(),
    portfolio: text('portfolio').array(),
    verificationStatus: verificationStatusEnum('verification_status')
      .default('pending')
      .notNull(),
    verificationDocumentUrl: text('verification_document_url'),
    linkedinUrl: text('linkedin_url'),
    bio: text('bio'),
    verifiedAt: timestamp('verified_at'),
    verifiedBy: varchar('verified_by', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    verificationStatusIdx: index('investor_verification_status_idx').on(
      table.verificationStatus,
    ),
  }),
)

export const talentProfiles = pgTable('talent_profiles', {
  userId: varchar('user_id', { length: 255 }).primaryKey(),
  role: varchar('role', { length: 100 }),
  title: varchar('title', { length: 100 }),
  skills: text('skills').array(),
  experienceYears: integer('experience_years'),
  resumeUrl: text('resume_url'),
  portfolioUrl: text('portfolio_url'),
  linkedinUrl: text('linkedin_url'),
  bio: text('bio'),
  availability: varchar('availability', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
