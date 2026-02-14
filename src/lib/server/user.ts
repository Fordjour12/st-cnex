import { db } from '@/db'
import { user } from '@/db/schema/auth'
import {
  founderProfiles,
  investorProfiles,
  talentProfiles,
} from '@/db/schema/profile'
import { auditLogs } from '@/db/schema/rbac'
import { eq, ilike, desc, asc, sql } from 'drizzle-orm'

export class UserService {
  static async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    sortBy?: 'createdAt' | 'email'
    sortOrder?: 'asc' | 'desc'
  }) {
    const { page = 1, limit = 20, search, sortOrder = 'desc' } = params

    const offset = (page - 1) * limit

    const orderFn = sortOrder === 'desc' ? desc : asc

    const result = await db
      .select()
      .from(user)
      .where(search ? ilike(user.email, `%${search}%`) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(orderFn(user.createdAt))

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(search ? ilike(user.email, `%${search}%`) : undefined)

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
    industriesOfInterest?: string[]
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
    skills?: string[]
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
    industriesOfInterest?: string[]
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
    skills?: string[]
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
}
