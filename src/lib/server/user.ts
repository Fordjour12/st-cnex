import { and, asc, desc, eq, gte, ilike, isNull, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { user } from '@/db/schema/auth'
import {
  founderProfiles,
  investorProfiles,
  talentProfiles,
} from '@/db/schema/profile'
import { auditLogs, userSuspensions } from '@/db/schema/rbac'

export class UserService {
  static async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    sortBy?: 'createdAt' | 'email'
    sortOrder?: 'asc' | 'desc'
  }) {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = params

    const offset = (page - 1) * limit

    const orderFn = sortOrder === 'desc' ? desc : asc
    const sortColumn = sortBy === 'email' ? user.email : user.createdAt
    const filters = and(
      search ? ilike(user.email, `%${search}%`) : undefined,
      role ? ilike(user.role, `%${role}%`) : undefined,
    )

    const result = await db
      .select()
      .from(user)
      .where(filters)
      .limit(limit)
      .offset(offset)
      .orderBy(orderFn(sortColumn))

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(filters)

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

  static async getUserById(userId: string) {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    return result
  }

  static async getUserProfile(userId: string) {
    const [founder] = await db
      .select()
      .from(founderProfiles)
      .where(eq(founderProfiles.userId, userId))
      .limit(1)

    const [investor] = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.userId, userId))
      .limit(1)

    const [talent] = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1)

    return { founder, investor, talent }
  }

  static async createFounderProfile(params: {
    userId: string
    startupName: string
    industry?: string
    stage?: string
    bio?: string
  }) {
    const { userId, startupName, industry, stage, bio } = params
    await db.insert(founderProfiles).values({
      userId,
      startupName,
      industry,
      stage,
      bio,
    })
    return { success: true }
  }

  static async createInvestorProfile(params: {
    userId: string
    investorType: string
    investmentRangeMin?: string
    investmentRangeMax?: string
    industriesOfInterest?: Array<string>
    bio?: string
  }) {
    const {
      userId,
      investorType,
      investmentRangeMin,
      investmentRangeMax,
      industriesOfInterest,
      bio,
    } = params
    await db.insert(investorProfiles).values({
      userId,
      investorType,
      investmentRangeMin,
      investmentRangeMax,
      industriesOfInterest,
      bio,
    })
    return { success: true }
  }

  static async createTalentProfile(params: {
    userId: string
    role: string
    title?: string
    skills?: Array<string>
    experienceYears?: number
    bio?: string
    availability?: string
  }) {
    const { userId, role, title, skills, experienceYears, bio, availability } =
      params
    await db.insert(talentProfiles).values({
      userId,
      role,
      title,
      skills,
      experienceYears,
      bio,
      availability,
    })
    return { success: true }
  }

  static async updateFounderProfile(params: {
    userId: string
    startupName?: string
    industry?: string
    stage?: string
    bio?: string
    websiteUrl?: string
    linkedinUrl?: string
  }) {
    const { userId, ...updates } = params
    await db
      .update(founderProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(founderProfiles.userId, userId))
    return { success: true }
  }

  static async updateInvestorProfile(params: {
    userId: string
    investorType?: string
    investmentRangeMin?: string
    investmentRangeMax?: string
    industriesOfInterest?: Array<string>
    bio?: string
    linkedinUrl?: string
  }) {
    const { userId, ...updates } = params
    await db
      .update(investorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(investorProfiles.userId, userId))
    return { success: true }
  }

  static async updateTalentProfile(params: {
    userId: string
    role?: string
    title?: string
    skills?: Array<string>
    experienceYears?: number
    bio?: string
    availability?: string
    linkedinUrl?: string
    resumeUrl?: string
    portfolioUrl?: string
  }) {
    const { userId, ...updates } = params
    await db
      .update(talentProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(talentProfiles.userId, userId))
    return { success: true }
  }

  static async createAuditLog(params: {
    userId?: string
    targetUserId?: string
    action:
      | 'user_suspended'
      | 'user_banned'
      | 'user_verified'
      | 'report_resolved'
      | 'role_assigned'
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
    })
    return { success: true }
  }

  static async suspendUser(params: {
    userId: string
    reason: string
    suspendedBy: string
    expiresAt?: Date
    ipAddress?: string
    userAgent?: string
  }) {
    const { userId, reason, suspendedBy, expiresAt, ipAddress, userAgent } =
      params

    await db.insert(userSuspensions).values({
      userId,
      reason,
      suspendedBy,
      expiresAt,
    })

    await this.createAuditLog({
      userId: suspendedBy,
      targetUserId: userId,
      action: 'user_suspended',
      resource: 'users',
      resourceId: userId,
      details: JSON.stringify({ reason, expiresAt }),
      ipAddress,
      userAgent,
    })

    return { success: true }
  }

  static async banUser(params: {
    userId: string
    reason: string
    bannedBy: string
    ipAddress?: string
    userAgent?: string
  }) {
    const { userId, reason, bannedBy, ipAddress, userAgent } = params

    await db.insert(userSuspensions).values({
      userId,
      reason,
      suspendedBy: bannedBy,
      expiresAt: null,
    })

    await this.createAuditLog({
      userId: bannedBy,
      targetUserId: userId,
      action: 'user_banned',
      resource: 'users',
      resourceId: userId,
      details: JSON.stringify({ reason }),
      ipAddress,
      userAgent,
    })

    return { success: true }
  }

  static async liftSuspension(params: {
    userId: string
    liftedBy: string
    ipAddress?: string
    userAgent?: string
  }) {
    const { userId, liftedBy, ipAddress, userAgent } = params

    await db
      .update(userSuspensions)
      .set({ liftedAt: new Date(), liftedBy })
      .where(
        and(
          eq(userSuspensions.userId, userId),
          isNull(userSuspensions.liftedAt),
        ),
      )

    await this.createAuditLog({
      userId: liftedBy,
      targetUserId: userId,
      action: 'user_suspended',
      resource: 'users',
      resourceId: userId,
      details: JSON.stringify({ action: 'lifted' }),
      ipAddress,
      userAgent,
    })

    return { success: true }
  }

  static async getUserSuspension(userId: string) {
    const [suspension] = await db
      .select()
      .from(userSuspensions)
      .where(
        and(
          eq(userSuspensions.userId, userId),
          isNull(userSuspensions.liftedAt),
          or(
            isNull(userSuspensions.expiresAt),
            gte(userSuspensions.expiresAt, new Date()),
          ),
        ),
      )
      .limit(1)
    return suspension
  }
}
