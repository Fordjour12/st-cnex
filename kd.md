# StartupConnect Admin System - Complete Architecture

## Using TanStack Start + TypeScript + better-auth

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
│  • better-auth for authentication                       │
│  • Session Management                                   │
│  • Middleware (Auth + RBAC)                            │
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
│           + better-auth Tables                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄 **Database Schema Design (Drizzle ORM + better-auth)**

> **Note**: better-auth manages its own user/session tables. We only define profile-specific tables and RBAC tables.

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
// NOTE: better-auth provides user/session tables
// Import from: import { user, session } from 'better-auth/react'
// ============================================

// ============================================
// RBAC TABLES
// ============================================

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// better-auth user ID reference
export const userRoles = pgTable(
  'user_roles',
  {
    userId: varchar('user_id', { length: 255 }).notNull(), // better-auth user ID
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    assignedBy: varchar('assigned_by', { length: 255 }), // better-auth user ID
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
    resource: varchar('resource', { length: 50 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
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
// PLATFORM-SPECIFIC TABLES (Reference better-auth user)
// ============================================

// Note: These tables reference better-auth's user via userId (varchar)

// ============================================
// better-auth provides: user, session, account, verification tables
// We use varchar(255) for userId to match better-auth's ID type
// ============================================

export const founderProfiles = pgTable('founder_profiles', {
  userId: varchar('user_id', { length: 255 }).primaryKey(), // better-auth user ID
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
    userId: varchar('user_id', { length: 255 }).primaryKey(), // better-auth user ID
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
    verifiedBy: varchar('verified_by', { length: 255 }), // better-auth user ID
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
  userId: varchar('user_id', { length: 255 }).primaryKey(), // better-auth user ID
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
    reporterId: varchar('reporter_id', { length: 255 }), // better-auth user ID
    reportedUserId: varchar('reported_user_id', { length: 255 }).notNull(), // better-auth user ID
    reportType: reportTypeEnum('report_type').notNull(),
    reason: text('reason').notNull(),
    description: text('description'),
    status: reportStatusEnum('status').default('pending').notNull(),
    reviewedBy: varchar('reviewed_by', { length: 255 }), // better-auth user ID
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
    userId: varchar('user_id', { length: 255 }).notNull(), // better-auth user ID
    reason: text('reason').notNull(),
    suspendedBy: varchar('suspended_by', { length: 255 }).notNull(), // better-auth user ID
    suspendedAt: timestamp('suspended_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'), // null = permanent
    liftedAt: timestamp('lifted_at'),
    liftedBy: varchar('lifted_by', { length: 255 }), // better-auth user ID
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
    userId: varchar('user_id', { length: 255 }), // Admin who performed action (better-auth)
    targetUserId: varchar('target_user_id', { length: 255 }), // User affected (better-auth)
    action: actionTypeEnum('action').notNull(),
    resource: varchar('resource', { length: 100 }).notNull(),
    resourceId: uuid('resource_id'),
    details: text('details'),
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
    userId: varchar('user_id', { length: 255 }).notNull(), // better-auth user ID
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    metadata: text('metadata'), // JSON
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_activity_user_id_idx').on(table.userId),
    createdAtIdx: index('user_activity_created_at_idx').on(table.createdAt),
  }),
)

// ============================================
// RELATIONS (Updated for better-auth)
// ============================================

// Note: better-auth manages user relations. We only define profile relations.
// User (from better-auth) → founderProfile, investorProfile, talentProfile
// These are accessed via the userId field
```

---

## 🔐 **RBAC Implementation (TanStack Start + better-auth)**

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
  super_admin: Object.values(PERMISSIONS),

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
import { userRoles, roles, rolePermissions, permissions } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { PERMISSIONS, type Permission } from '~/lib/permissions'

export class RBACService {
  /**
   * Get all permissions for a user (by better-auth user ID)
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

  /**
   * Assign role to user
   */
  static async assignRole(params: {
    userId: string
    roleId: number
    assignedBy: string
  }) {
    const { userId, roleId, assignedBy } = params
    await db.insert(userRoles).values({
      userId,
      roleId,
      assignedBy,
    })
  }
}
```

---

## 🛡 **Middleware & Route Protection (better-auth)**

### **File: `src/lib/server/auth.ts` (Server Functions)**

```typescript
import { cookies, createServerFn } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

const COOKIE_NAME = 'better-auth.session_token'

export const signIn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const session = await auth.api.signIn({
      body: {
        email: data.email,
        password: data.password,
      },
    })

    const cookieHeader = session.headers.get('set-cookie')
    if (cookieHeader) {
      const [cookie] = cookieHeader.split(';')
      const [name, value] = cookie.split('=')

      cookies().set(name, value, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return { session }
  })

export const signUp = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: { email: string; password: string; name: string }) => data,
  )
  .handler(async ({ data }) => {
    const session = await auth.api.signUp({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    })

    const cookieHeader = session.headers.get('set-cookie')
    if (cookieHeader) {
      const [cookie] = cookieHeader.split(';')
      const [name, value] = cookie.split('=')

      cookies().set(name, value, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return { session }
  })

export const signOut = createServerFn({
  method: 'POST',
}).handler(async ({ request }) => {
  const cookieHeader = request.headers.get('cookie')
  const sessionToken = cookieHeader?.match(
    /better-auth\.session_token=([^;]+)/,
  )?.[1]

  if (sessionToken) {
    await auth.api.signOut({
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`,
      },
    })
  }

  cookies().delete(COOKIE_NAME)

  return { success: true }
})

export const getSession = createServerFn({
  method: 'GET',
}).handler(async ({ request }) => {
  const cookieHeader = request.headers.get('cookie')
  const sessionToken = cookieHeader?.match(
    /better-auth\.session_token=([^;]+)/,
  )?.[1]

  if (!sessionToken) {
    return { session: null }
  }

  const session = await auth.api.getSession({
    headers: {
      cookie: `better-auth.session_token=${sessionToken}`,
    },
  })

  return { session }
})
```

### **File: `src/middleware/auth.ts`**

```typescript
import { createMiddleware } from '@tanstack/start'
import { getSession } from '~/lib/server/auth'
import { RBACService } from '~/lib/auth/rbac'
import type { Permission } from '~/lib/permissions'

/**
 * Require authentication (for loaders)
 */
export const requireAuth = createMiddleware().server(
  async ({ next, request }) => {
    const cookieHeader = request.headers.get('cookie')
    const sessionToken = cookieHeader?.match(
      /better-auth\.session_token=([^;]+)/,
    )?.[1]

    if (!sessionToken) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const { session } = await getSession({ request })

    if (!session) {
      throw new Response('Unauthorized', { status: 401 })
    }

    return next({
      context: {
        user: session.user,
      },
    })
  },
)

/**
 * Require admin role
 */
export const requireAdmin = createMiddleware().server(
  async ({ next, request }) => {
    const cookieHeader = request.headers.get('cookie')
    const sessionToken = cookieHeader?.match(
      /better-auth\.session_token=([^;]+)/,
    )?.[1]

    if (!sessionToken) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const { session } = await getSession({ request })

    if (!session) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const isAdmin = await RBACService.isAdmin(session.user.id)

    if (!isAdmin) {
      throw new Response('Forbidden: Admin access required', { status: 403 })
    }

    return next({
      context: {
        user: session.user,
      },
    })
  },
)

/**
 * Require specific permission
 */
export const requirePermission = (permission: Permission) => {
  return createMiddleware().server(async ({ next, request }) => {
    const cookieHeader = request.headers.get('cookie')
    const sessionToken = cookieHeader?.match(
      /better-auth\.session_token=([^;]+)/,
    )?.[1]

    if (!sessionToken) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const { session } = await getSession({ request })

    if (!session) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      permission,
    )

    if (!hasPermission) {
      throw new Response(`Forbidden: Missing permission ${permission}`, {
        status: 403,
      })
    }

    return next({
      context: {
        user: session.user,
      },
    })
  })
}

/**
 * Require any of the permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return createMiddleware().server(async ({ next, request }) => {
    const cookieHeader = request.headers.get('cookie')
    const sessionToken = cookieHeader?.match(
      /better-auth\.session_token=([^;]+)/,
    )?.[1]

    if (!sessionToken) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const { session } = await getSession({ request })

    if (!session) {
      throw new Response('Unauthorized', { status: 401 })
    }

    const hasPermission = await RBACService.hasAnyPermission(
      session.user.id,
      permissions,
    )

    if (!hasPermission) {
      throw new Response(`Forbidden: Missing required permissions`, {
        status: 403,
      })
    }

    return next({
      context: {
        user: session.user,
      },
    })
  })
}
```

---

## 🔧 **Service Layer - User Management (better-auth)**

### **File: `src/services/user.service.ts`**

```typescript
import { db } from '~/db'
import { user, userSuspensions, auditLogs } from '~/db/schema'
import { eq, and, isNull, or, ilike, desc, asc, sql } from 'drizzle-orm'

// Type for better-auth user
type BetterAuthUser = typeof user.$inferSelect

export class UserService {
  /**
   * Get all users (from better-auth) with filters and pagination
   */
  static async getUsers(params: {
    page?: number
    limit?: number
    status?: string
    search?: string
    role?: string
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email'
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params

    const offset = (page - 1) * limit

    // Query better-auth's user table
    let query = db
      .select()
      .from(user)
      .where(
        and(
          search
            ? or(
                ilike(user.email, `%${search}%`),
                ilike(user.name, `%${search}%`),
              )
            : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)

    // Apply sorting
    const sortColumn = user[sortBy]
    query =
      sortOrder === 'desc'
        ? query.orderBy(desc(sortColumn))
        : query.orderBy(asc(sortColumn))

    const result = await query

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(
        and(
          search
            ? or(
                ilike(user.email, `%${search}%`),
                ilike(user.name, `%${search}%`),
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

    // Update user in better-auth (add to session metadata or custom table)
    // For better-auth, we use the userSuspensions table
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
   * Get user details by ID (from better-auth)
   */
  static async getUserDetails(userId: string) {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    })

    return userRecord
  }
}
```

---

## 📊 **Service Layer - Analytics (better-auth)**

### **File: `src/services/analytics.service.ts`**

```typescript
import { db } from '~/db'
import {
  user,
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
      { totalFounders },
      { totalInvestors },
      { totalTalent },
      { pendingReports },
      { verifiedInvestors },
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
      totalUsers,
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
        date: sql<string>`date_trunc(${interval}, ${user.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(user)
      .where(and(gte(user.createdAt, startDate), lte(user.createdAt, endDate)))
      .groupBy(sql`date_trunc(${interval}, ${user.createdAt})`)
      .orderBy(sql`date_trunc(${interval}, ${user.createdAt})`)

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

## 🚀 **TanStack Start Server Functions (API Endpoints + better-auth)**

### **File: `src/lib/server/admin/users.ts`**

```typescript
import { createServerFn } from '@tanstack/react-start'
import { UserService } from '~/services/user.service'
import { RBACService } from '~/lib/auth/rbac'
import { PERMISSIONS } from '~/lib/permissions'
import { getSession } from '~/lib/server/auth'
import { z } from 'zod'

// ============================================
// GET ALL USERS
// ============================================

const getUsersSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'email']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const getUsers = createServerFn({ method: 'GET' })
  .inputValidator(getUsersSchema)
  .handler(async ({ data, request }) => {
    const cookieHeader = request.headers.get('cookie')
    const { session } = await getSession({ request })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      session.user.id,
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
  userId: z.string(),
  reason: z.string().min(10),
  expiresAt: z.date().optional(),
})

export const suspendUser = createServerFn({ method: 'POST' })
  .inputValidator(suspendUserSchema)
  .handler(async ({ data, request }) => {
    const { session } = await getSession({ request })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      PERMISSIONS.USERS_SUSPEND,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.suspend')
    }

    return await UserService.suspendUser({
      ...data,
      suspendedBy: session.user.id,
    })
  })

// ============================================
// BAN USER
// ============================================

const banUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
})

export const banUser = createServerFn({ method: 'POST' })
  .inputValidator(banUserSchema)
  .handler(async ({ data, request }) => {
    const { session } = await getSession({ request })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      PERMISSIONS.USERS_BAN,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.ban')
    }

    return await UserService.banUser({
      ...data,
      bannedBy: session.user.id,
    })
  })

// ============================================
// LIFT SUSPENSION
// ============================================

const liftSuspensionSchema = z.object({
  userId: z.string(),
})

export const liftSuspension = createServerFn({ method: 'POST' })
  .inputValidator(liftSuspensionSchema)
  .handler(async ({ data, request }) => {
    const { session } = await getSession({ request })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      PERMISSIONS.USERS_SUSPEND,
    )

    if (!hasPermission) {
      throw new Error('Forbidden: Missing permission users.suspend')
    }

    return await UserService.liftSuspension({
      ...data,
      liftedBy: session.user.id,
    })
  })
```

---

## 🎨 **Frontend - Admin Routes (better-auth)**

### **File: `src/routes/admin/__root.tsx`**

```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '~/lib/server/auth'
import { RBACService } from '~/lib/auth/rbac'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ request }) => {
    const { session } = await getSession({ request })

    if (!session) {
      throw redirect({ to: '/login' })
    }

    const isAdmin = await RBACService.isAdmin(session.user.id)

    if (!isAdmin) {
      throw redirect({ to: '/' })
    }

    return { user: session.user }
  },
  component: AdminLayout,
})

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
  )
}
```

### **File: `src/routes/admin/users/index.tsx`**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getUsers } from '~/lib/server/admin/users'
import { AdminUsersTable } from '~/components/admin/AdminUsersTable'

export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => getUsers({ data: { page: 1, limit: 20 } }),
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <AdminUsersTable data={data} />
    </div>
  )
}
```

---

## 📋 **Development Task Breakdown (better-auth)**

### **Phase 1: Foundation (Week 1-2)**

**Sprint 1.1: Database & Auth Setup**

- [ ] Set up PostgreSQL + Drizzle ORM
- [ ] Set up better-auth with database adapter
- [ ] Create all database tables with indexes
- [ ] Seed initial roles and permissions
- [ ] Configure better-auth (sign in, sign up, session)
- [ ] Set up OAuth providers (Google, GitHub)

**Sprint 1.2: RBAC Implementation**

- [ ] Build RBACService with permission checks
- [ ] Create userRoles table and relations
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

## 🔒 **Security Checklist (better-auth)**

✅ **Authentication & Authorization**

- [ ] All admin routes protected by middleware
- [ ] All API endpoints check permissions
- [ ] better-auth session cookies properly secured (httpOnly, secure, sameSite)
- [ ] Role-based access enforced at DB level
- [ ] OAuth providers configured securely

✅ **Data Protection**

- [ ] Audit logs for all admin actions
- [ ] better-auth handles user data securely
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Drizzle handles this)

✅ **Operational Security**

- [ ] Rate limiting on admin endpoints
- [ ] IP logging for admin actions
- [ ] Two-factor authentication (better-auth supports 2FA)
- [ ] Regular permission audits

---

This is a production-ready architecture for StartupConnect's admin system using **better-auth**. Would you like me to:

1. **Create actual code files** for any specific component?
2. **Design the frontend UI** with TailwindCSS components?
3. **Build the seed scripts** for initial data?
4. **Add testing strategy** (unit + integration tests)?
