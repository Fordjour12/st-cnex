# StartupConnect Admin System - Complete Architecture

## Using TanStack Start + TypeScript

I'll design a production-ready admin system optimized for **TanStack Start** with full RBAC, security, and scalability.

---

## 🏗 **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Layer                        │
├─────────────────────────────────────────────────────────┤
│  User App          │         Admin Dashboard            │
│  /app/*            │         /admin/*                   │
│  (Public)          │         (Protected)                │
│                    │                                     │
│  • TanStack Router • TanStack Query                     │
│  • React Components • TanStack Table (for admin lists)  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         TanStack Start Server Functions                 │
├─────────────────────────────────────────────────────────┤
│  • createServerFn (API endpoints)                      │
│  • Middleware (Auth + RBAC)                            │
│  • Session Management                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)             │
├─────────────────────────────────────────────────────────┤
│  • UserService      • ModerationService                │
│  • AnalyticsService • AuditLogService                  │
│  • PermissionService                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Database Layer (PostgreSQL + Drizzle)         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄 **Database Schema Design (Drizzle ORM)**

### **File: `src/db/schema.ts`**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  serial,
  integer,
  decimal,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================
// ENUMS
// ============================================

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'banned',
  'pending',
])
export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'verified',
  'rejected',
])
export const reportStatusEnum = pgEnum('report_status', [
  'pending',
  'reviewing',
  'resolved',
  'dismissed',
])
export const reportTypeEnum = pgEnum('report_type', [
  'user',
  'message',
  'profile',
  'content',
])
export const actionTypeEnum = pgEnum('action_type', [
  'user_suspended',
  'user_banned',
  'user_verified',
  'report_resolved',
  'role_assigned',
])

// ============================================
// CORE USER & AUTH TABLES
// ============================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    status: userStatusEnum('status').default('active').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
    deletedAt: timestamp('deleted_at'), // Soft delete
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    statusIdx: index('users_status_idx').on(table.status),
  }),
)

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    assignedBy: uuid('assigned_by').references(() => users.id),
  },
  (table) => ({
    pk: { name: 'user_roles_pk', columns: [table.userId, table.roleId] },
  }),
)

export const permissions = pgTable(
  'permissions',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    resource: varchar('resource', { length: 50 }).notNull(), // users, startups, investors, analytics
    action: varchar('action', { length: 50 }).notNull(), // view, create, update, delete, suspend
    description: text('description'),
  },
  (table) => ({
    resourceActionIdx: index('permissions_resource_action_idx').on(
      table.resource,
      table.action,
    ),
  }),
)

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: integer('permission_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pk: {
      name: 'role_permissions_pk',
      columns: [table.roleId, table.permissionId],
    },
  }),
)

// ============================================
// PLATFORM-SPECIFIC TABLES
// ============================================

export const founderProfiles = pgTable('founder_profiles', {
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  startupName: varchar('startup_name', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  stage: varchar('stage', { length: 50 }), // idea, mvp, early_revenue, scaling
  pitchDeckUrl: text('pitch_deck_url'),
  websiteUrl: text('website_url'),
  linkedinUrl: text('linkedin_url'),
  verified: boolean('verified').default(false).notNull(),
  verificationNotes: text('verification_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const investorProfiles = pgTable(
  'investor_profiles',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .primaryKey(),
    investorType: varchar('investor_type', { length: 50 }), // angel, vc, corporate
    investmentRangeMin: decimal('investment_range_min', {
      precision: 15,
      scale: 2,
    }),
    investmentRangeMax: decimal('investment_range_max', {
      precision: 15,
      scale: 2,
    }),
    industriesOfInterest: text('industries_of_interest').array(),
    verificationStatus: verificationStatusEnum('verification_status')
      .default('pending')
      .notNull(),
    verificationDocumentUrl: text('verification_document_url'),
    linkedinUrl: text('linkedin_url'),
    portfolioUrl: text('portfolio_url'),
    verifiedAt: timestamp('verified_at'),
    verifiedBy: uuid('verified_by').references(() => users.id),
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
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  role: varchar('role', { length: 100 }), // CTO, CMO, Developer, Designer
  skills: text('skills').array(),
  experienceYears: integer('experience_years'),
  resumeUrl: text('resume_url'),
  portfolioUrl: text('portfolio_url'),
  linkedinUrl: text('linkedin_url'),
  availability: varchar('availability', { length: 50 }), // full_time, part_time, contract
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// MODERATION & SAFETY TABLES
// ============================================

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: uuid('reporter_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reportedUserId: uuid('reported_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    reportType: reportTypeEnum('report_type').notNull(),
    reason: text('reason').notNull(),
    description: text('description'),
    status: reportStatusEnum('status').default('pending').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    resolution: text('resolution'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('reports_status_idx').on(table.status),
    reportedUserIdx: index('reports_reported_user_idx').on(
      table.reportedUserId,
    ),
  }),
)

export const userSuspensions = pgTable(
  'user_suspensions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    reason: text('reason').notNull(),
    suspendedBy: uuid('suspended_by')
      .references(() => users.id)
      .notNull(),
    suspendedAt: timestamp('suspended_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'), // null = permanent
    liftedAt: timestamp('lifted_at'),
    liftedBy: uuid('lifted_by').references(() => users.id),
  },
  (table) => ({
    userIdIdx: index('user_suspensions_user_id_idx').on(table.userId),
  }),
)

// ============================================
// AUDIT LOG (Critical for admin actions)
// ============================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }), // Admin who performed action
    targetUserId: uuid('target_user_id').references(() => users.id, {
      onDelete: 'set null',
    }), // User affected
    action: actionTypeEnum('action').notNull(),
    resource: varchar('resource', { length: 100 }).notNull(), // users, reports, roles
    resourceId: uuid('resource_id'), // ID of the affected resource
    details: text('details'), // JSON or text description
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    targetUserIdIdx: index('audit_logs_target_user_id_idx').on(
      table.targetUserId,
    ),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  }),
)

// ============================================
// ANALYTICS TRACKING
// ============================================

export const userActivity = pgTable(
  'user_activity',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    activityType: varchar('activity_type', { length: 50 }).notNull(), // login, profile_view, message_sent
    metadata: text('metadata'), // JSON
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_activity_user_id_idx').on(table.userId),
    createdAtIdx: index('user_activity_created_at_idx').on(table.createdAt),
  }),
)

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(userRoles),
  founderProfile: one(founderProfiles),
  investorProfile: one(investorProfiles),
  talentProfile: one(talentProfiles),
  reportsMade: many(reports, { relationName: 'reporter' }),
  reportsReceived: many(reports, { relationName: 'reported' }),
  suspensions: many(userSuspensions),
  auditLogs: many(auditLogs),
  activities: many(userActivity),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))
```

---

## 🔐 **RBAC Implementation (TanStack Start)**

### **File: `src/lib/permissions.ts`**

```typescript
// Permission definitions
export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_SUSPEND: 'users.suspend',
  USERS_BAN: 'users.ban',

  // Investors
  INVESTORS_VERIFY: 'investors.verify',
  INVESTORS_REJECT: 'investors.reject',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_REVIEW: 'reports.review',
  REPORTS_RESOLVE: 'reports.resolve',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_ASSIGN: 'roles.assign',
  ROLES_REVOKE: 'roles.revoke',

  // System
  SYSTEM_SETTINGS: 'system.settings',
  AUDIT_LOGS_VIEW: 'audit_logs.view',
} as const

// Role definitions with permissions
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // All permissions

  admin: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.INVESTORS_VERIFY,
    PERMISSIONS.INVESTORS_REJECT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_REVIEW,
    PERMISSIONS.REPORTS_RESOLVE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],

  moderator: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_REVIEW,
    PERMISSIONS.REPORTS_RESOLVE,
  ],

  founder: [],
  investor: [],
  talent: [],
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
export type RoleName = keyof typeof ROLE_PERMISSIONS
```

### **File: `src/lib/auth/rbac.ts`**

```typescript
import { db } from '~/db'
import {
  users,
  userRoles,
  roles,
  rolePermissions,
  permissions,
} from '~/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { PERMISSIONS, type Permission } from '~/lib/permissions'

export class RBACService {
  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const result = await db
      .select({
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))

    return result.map((r) => r.permissionName as Permission)
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return userPermissions.includes(permission)
  }

  /**
   * Check if user has ANY of the permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissions: Permission[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return permissions.some((p) => userPermissions.includes(p))
  }

  /**
   * Check if user has ALL permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return permissions.every((p) => userPermissions.includes(p))
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    const result = await db
      .select({
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    return result.map((r) => r.roleName)
  }

  /**
   * Check if user is admin (has admin or super_admin role)
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const userRolesResult = await this.getUserRoles(userId)
    return userRolesResult.some((r) => r === 'admin' || r === 'super_admin')
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    const userRolesResult = await this.getUserRoles(userId)
    return userRolesResult.includes('super_admin')
  }
}
```

---

## 🛡 **Middleware & Route Protection**

### **File: `src/middleware/auth.ts`**

```typescript
import { createMiddleware } from '@tanstack/start'
import { getSessionUser } from '~/lib/auth/session'
import { RBACService } from '~/lib/auth/rbac'
import type { Permission } from '~/lib/permissions'

/**
 * Require authentication
 */
export const requireAuth = createMiddleware().server(
  async ({ next, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Response('Unauthorized', { status: 401 })
    }

    return next({
      context: {
        ...context,
        user,
      },
    })
  },
)

/**
 * Require admin role
 */
export const requireAdmin = createMiddleware().server(
  async ({ next, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const isAdmin = await RBACService.isAdmin(user.id)

    if (!isAdmin) {
      throw new Response('Forbidden: Admin access required', { status: 403 })
    }

    return next({
      context: {
        ...context,
        user,
      },
    })
  },
)

/**
 * Require specific permission
 */
export const requirePermission = (permission: Permission) => {
  return createMiddleware().server(async ({ next, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const hasPermission = await RBACService.hasPermission(user.id, permission)

    if (!hasPermission) {
      throw new Response(`Forbidden: Missing permission ${permission}`, {
        status: 403,
      })
    }

    return next({
      context: {
        ...context,
        user,
      },
    })
  })
}

/**
 * Require any of the permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return createMiddleware().server(async ({ next, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const hasPermission = await RBACService.hasAnyPermission(
      user.id,
      permissions,
    )

    if (!hasPermission) {
      throw new Response(`Forbidden: Missing required permissions`, {
        status: 403,
      })
    }

    return next({
      context: {
        ...context,
        user,
      },
    })
  })
}
```

---

## 🔧 **Service Layer - User Management**

### **File: `src/services/user.service.ts`**

```typescript
import { db } from '~/db'
import { users, userSuspensions, auditLogs } from '~/db/schema'
import { eq, and, isNull, or, ilike, desc, asc, sql } from 'drizzle-orm'
import type { userStatusEnum } from '~/db/schema'

export class UserService {
  /**
   * Get all users with filters and pagination
   */
  static async getUsers(params: {
    page?: number
    limit?: number
    status?: (typeof userStatusEnum.enumValues)[number]
    search?: string
    role?: string
    sortBy?: 'created_at' | 'last_login_at' | 'email'
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params

    const offset = (page - 1) * limit

    let query = db
      .select()
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          status ? eq(users.status, status) : undefined,
          search
            ? or(
                ilike(users.email, `%${search}%`),
                ilike(users.fullName, `%${search}%`),
              )
            : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)

    // Apply sorting
    const sortColumn = users[sortBy]
    query =
      sortOrder === 'desc'
        ? query.orderBy(desc(sortColumn))
        : query.orderBy(asc(sortColumn))

    const result = await query

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          status ? eq(users.status, status) : undefined,
          search
            ? or(
                ilike(users.email, `%${search}%`),
                ilike(users.fullName, `%${search}%`),
              )
            : undefined,
        ),
      )

    return {
      users: result,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    }
  }

  /**
   * Suspend a user
   */
  static async suspendUser(params: {
    userId: string
    reason: string
    suspendedBy: string
    expiresAt?: Date
  }) {
    const { userId, reason, suspendedBy, expiresAt } = params

    // Update user status
    await db
      .update(users)
      .set({ status: 'suspended', updatedAt: new Date() })
      .where(eq(users.id, userId))

    // Create suspension record
    await db.insert(userSuspensions).values({
      userId,
      reason,
      suspendedBy,
      expiresAt,
    })

    // Create audit log
    await db.insert(auditLogs).values({
      userId: suspendedBy,
      targetUserId: userId,
      action: 'user_suspended',
      resource: 'users',
      resourceId: userId,
      details: JSON.stringify({ reason, expiresAt }),
    })

    return { success: true }
  }

  /**
   * Ban a user
   */
  static async banUser(params: {
    userId: string
    reason: string
    bannedBy: string
  }) {
    const { userId, reason, bannedBy } = params

    await db
      .update(users)
      .set({ status: 'banned', updatedAt: new Date() })
      .where(eq(users.id, userId))

    await db.insert(userSuspensions).values({
      userId,
      reason,
      suspendedBy: bannedBy,
      expiresAt: null, // Permanent
    })

    await db.insert(auditLogs).values({
      userId: bannedBy,
      targetUserId: userId,
      action: 'user_banned',
      resource: 'users',
      resourceId: userId,
      details: JSON.stringify({ reason }),
    })

    return { success: true }
  }

  /**
   * Lift suspension
   */
  static async liftSuspension(params: { userId: string; liftedBy: string }) {
    const { userId, liftedBy } = params

    await db
      .update(users)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(users.id, userId))

    await db
      .update(userSuspensions)
      .set({ liftedAt: new Date(), liftedBy })
      .where(
        and(
          eq(userSuspensions.userId, userId),
          isNull(userSuspensions.liftedAt),
        ),
      )

    await db.insert(auditLogs).values({
      userId: liftedBy,
      targetUserId: userId,
      action: 'user_suspended',
      resource: 'users',
      resourceId: userId,
      details: JSON.stringify({ action: 'lifted' }),
    })

    return { success: true }
  }

  /**
   * Get user details with profile
   */
  static async getUserDetails(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        founderProfile: true,
        investorProfile: true,
        talentProfile: true,
        roles: {
          with: {
            role: true,
          },
        },
        suspensions: {
          where: isNull(userSuspensions.liftedAt),
          orderBy: desc(userSuspensions.suspendedAt),
        },
      },
    })

    return user
  }
}
```

---

## 📊 **Service Layer - Analytics**

### **File: `src/services/analytics.service.ts`**

```typescript
import { db } from '~/db'
import {
  users,
  userActivity,
  investorProfiles,
  founderProfiles,
  talentProfiles,
  reports,
} from '~/db/schema'
import { sql, and, gte, lte, eq } from 'drizzle-orm'

export class AnalyticsService {
  /**
   * Get platform overview stats
   */
  static async getPlatformStats() {
    const [
      { totalUsers },
      { activeUsers },
      { totalFounders },
      { totalInvestors },
      { totalTalent },
      { pendingReports },
      { verifiedInvestors },
    ] = await Promise.all([
      db.select({ totalUsers: sql<number>`count(*)::int` }).from(users),
      db
        .select({ activeUsers: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.status, 'active')),
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
      totalUsers,
      activeUsers,
      totalFounders,
      totalInvestors,
      totalTalent,
      pendingReports,
      verifiedInvestors,
    }
  }

  /**
   * Get user growth over time
   */
  static async getUserGrowth(params: {
    startDate: Date
    endDate: Date
    interval: 'day' | 'week' | 'month'
  }) {
    const { startDate, endDate, interval } = params

    const result = await db
      .select({
        date: sql<string>`date_trunc(${interval}, ${users.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(
        and(gte(users.createdAt, startDate), lte(users.createdAt, endDate)),
      )
      .groupBy(sql`date_trunc(${interval}, ${users.createdAt})`)
      .orderBy(sql`date_trunc(${interval}, ${users.createdAt})`)

    return result
  }

  /**
   * Get daily/monthly active users (DAU/MAU)
   */
  static async getActiveUsers(params: { days: number }) {
    const { days } = params
    const since = new Date()
    since.setDate(since.getDate() - days)

    const result = await db
      .select({
        date: sql<string>`date_trunc('day', ${userActivity.createdAt})`,
        uniqueUsers: sql<number>`count(distinct ${userActivity.userId})::int`,
      })
      .from(userActivity)
      .where(gte(userActivity.createdAt, since))
      .groupBy(sql`date_trunc('day', ${userActivity.createdAt})`)
      .orderBy(sql`date_trunc('day', ${userActivity.createdAt})`)

    return result
  }

  /**
   * Get investor verification stats
   */
  static async getInvestorVerificationStats() {
    const result = await db
      .select({
        status: investorProfiles.verificationStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(investorProfiles)
      .groupBy(investorProfiles.verificationStatus)

    return result
  }
}
```

---

## 🚀 **TanStack Start Server Functions (API Endpoints)**

### **File: `src/app/api/admin/users.ts`**

```typescript
import { createServerFn } from '@tanstack/start'
import { UserService } from '~/services/user.service'
import { RBACService } from '~/lib/auth/rbac'
import { PERMISSIONS } from '~/lib/permissions'
import { getSessionUser } from '~/lib/auth/session'
import { z } from 'zod'

// ============================================
// GET ALL USERS
// ============================================

const getUsersSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  status: z.enum(['active', 'suspended', 'banned', 'pending']).optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z.enum(['created_at', 'last_login_at', 'email']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const getUsers = createServerFn({ method: 'GET' })
  .validator(getUsersSchema)
  .handler(async ({ data, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      user.id,
      PERMISSIONS.USERS_VIEW,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.view')
    }

    return await UserService.getUsers(data)
  })

// ============================================
// SUSPEND USER
// ============================================

const suspendUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10),
  expiresAt: z.date().optional(),
})

export const suspendUser = createServerFn({ method: 'POST' })
  .validator(suspendUserSchema)
  .handler(async ({ data, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      user.id,
      PERMISSIONS.USERS_SUSPEND,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.suspend')
    }

    return await UserService.suspendUser({
      ...data,
      suspendedBy: user.id,
    })
  })

// ============================================
// BAN USER
// ============================================

const banUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10),
})

export const banUser = createServerFn({ method: 'POST' })
  .validator(banUserSchema)
  .handler(async ({ data, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      user.id,
      PERMISSIONS.USERS_BAN,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.ban')
    }

    return await UserService.banUser({
      ...data,
      bannedBy: user.id,
    })
  })

// ============================================
// LIFT SUSPENSION
// ============================================

const liftSuspensionSchema = z.object({
  userId: z.string().uuid(),
})

export const liftSuspension = createServerFn({ method: 'POST' })
  .validator(liftSuspensionSchema)
  .handler(async ({ data, context }) => {
    const user = await getSessionUser(context)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      user.id,
      PERMISSIONS.USERS_SUSPEND,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.suspend')
    }

    return await UserService.liftSuspension({
      ...data,
      liftedBy: user.id,
    })
  })
```

---

## 🎨 **Frontend - Admin Routes**

### **File: `src/routes/admin/__root.tsx`**

```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getSessionUser } from '~/lib/auth/session';
import { RBACService } from '~/lib/auth/rbac';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const user = await getSessionUser(context);

    if (!user) {
      throw redirect({ to: '/login' });
    }

    const isAdmin = await RBACService.isAdmin(user.id);

    if (!isAdmin) {
      throw redirect({ to: '/' });
    }

    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="mt-8">
          {/* Navigation links */}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

### **File: `src/routes/admin/users/index.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getUsers } from '~/app/api/admin/users';
import { AdminUsersTable } from '~/components/admin/AdminUsersTable';

export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => getUsers({ page: 1, limit: 20 }),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <AdminUsersTable data={data} />
    </div>
  );
}
```

---

## 📋 **Development Task Breakdown**

### **Phase 1: Foundation (Week 1-2)**

**Sprint 1.1: Database & Auth Setup**

- [ ] Set up PostgreSQL + Drizzle ORM
- [ ] Create all database tables with indexes
- [ ] Seed initial roles and permissions
- [ ] Implement basic auth (login/register)
- [ ] Create session management

**Sprint 1.2: RBAC Implementation**

- [ ] Build RBACService with permission checks
- [ ] Create middleware for route protection
- [ ] Test permission enforcement
- [ ] Create admin user seeding script

---

### **Phase 2: Core Admin Features (Week 3-4)**

**Sprint 2.1: User Management**

- [ ] Build UserService (CRUD operations)
- [ ] Create server functions for user management
- [ ] Build admin users list page with TanStack Table
- [ ] Implement user suspend/ban actions
- [ ] Add user detail view

**Sprint 2.2: Moderation System**

- [ ] Build ReportService
- [ ] Create reports list page
- [ ] Implement report review workflow
- [ ] Add report resolution actions
- [ ] Build audit log tracking

---

### **Phase 3: Analytics & Monitoring (Week 5)**

**Sprint 3.1: Analytics Dashboard**

- [ ] Build AnalyticsService
- [ ] Create analytics server functions
- [ ] Build dashboard with charts (Recharts)
- [ ] Implement DAU/MAU tracking
- [ ] Add export functionality

**Sprint 3.2: Investor Verification**

- [ ] Build verification queue
- [ ] Create verification review UI
- [ ] Implement approve/reject workflow
- [ ] Add verification notifications

---

### **Phase 4: Advanced Features (Week 6+)**

**Sprint 4.1: Advanced Moderation**

- [ ] Implement risk scoring
- [ ] Add fraud detection flags
- [ ] Build automated moderation rules
- [ ] Create warning system

**Sprint 4.2: System Management**

- [ ] Build settings management
- [ ] Add feature toggles
- [ ] Create email template editor
- [ ] Implement platform announcements

---

## 🔒 **Security Checklist**

✅ **Authentication & Authorization**

- [ ] All admin routes protected by middleware
- [ ] All API endpoints check permissions
- [ ] JWT/session properly secured
- [ ] Role-based access enforced at DB level

✅ **Data Protection**

- [ ] Audit logs for all admin actions
- [ ] Soft delete for users
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Drizzle handles this)

✅ **Operational Security**

- [ ] Rate limiting on admin endpoints
- [ ] IP logging for admin actions
- [ ] Two-factor authentication for super admins
- [ ] Regular permission audits

---

This is a production-ready architecture for StartupConnect's admin system. Would you like me to:

1. **Create actual code files** for any specific component?
2. **Design the frontend UI** with TailwindCSS components?
3. **Build the seed scripts** for initial data?
4. **Add testing strategy** (unit + integration tests)?
