import { db } from '@/db'
import { investorProfiles } from '@/db/schema/profile'
import { user } from '@/db/schema/auth'
import { sql, eq } from 'drizzle-orm'

export interface InvestorCredibilityScore {
  userId: string
  score: number
  breakdown: {
    verified: number
    linkedin: number
    portfolio: number
    completeProfile: number
  }
  badge: 'gold' | 'silver' | 'bronze' | null
}

export class CredibilityService {
  private static readonly SCORE_WEIGHTS = {
    verified: 50,
    linkedin: 15,
    portfolio: 15,
    completeProfile: 10,
  }

  static calculateScore(profile: {
    verificationStatus: string | null
    linkedinUrl: string | null
    portfolio: string[] | null
    bio: string | null
    investorType: string | null
    investmentRangeMin: string | null
  }): InvestorCredibilityScore['breakdown'] {
    const breakdown = {
      verified:
        profile.verificationStatus === 'verified'
          ? this.SCORE_WEIGHTS.verified
          : 0,
      linkedin: profile.linkedinUrl ? this.SCORE_WEIGHTS.linkedin : 0,
      portfolio:
        profile.portfolio && profile.portfolio.length > 0
          ? this.SCORE_WEIGHTS.portfolio
          : 0,
      completeProfile: this.isProfileComplete(profile)
        ? this.SCORE_WEIGHTS.completeProfile
        : 0,
    }

    return breakdown
  }

  private static isProfileComplete(profile: {
    bio: string | null
    investorType: string | null
    investmentRangeMin: string | null
  }): boolean {
    return !!(profile.bio && profile.investorType && profile.investmentRangeMin)
  }

  static getBadge(score: number): 'gold' | 'silver' | 'bronze' | null {
    if (score >= 80) return 'gold'
    if (score >= 50) return 'silver'
    if (score >= 30) return 'bronze'
    return null
  }

  static async getInvestorCredibility(
    userId: string,
  ): Promise<InvestorCredibilityScore | null> {
    const [profile] = await db
      .select({
        userId: investorProfiles.userId,
        verificationStatus: investorProfiles.verificationStatus,
        linkedinUrl: investorProfiles.linkedinUrl,
        portfolio: investorProfiles.portfolio,
        bio: investorProfiles.bio,
        investorType: investorProfiles.investorType,
        investmentRangeMin: investorProfiles.investmentRangeMin,
      })
      .from(investorProfiles)
      .where(eq(investorProfiles.userId, userId))
      .limit(1)

    if (!profile) return null

    const breakdown = this.calculateScore(profile)
    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

    return {
      userId: profile.userId,
      score,
      breakdown,
      badge: this.getBadge(score),
    }
  }

  static async getAllInvestorsCredibility(): Promise<
    InvestorCredibilityScore[]
  > {
    const profiles = await db
      .select({
        userId: investorProfiles.userId,
        verificationStatus: investorProfiles.verificationStatus,
        linkedinUrl: investorProfiles.linkedinUrl,
        portfolio: investorProfiles.portfolio,
        bio: investorProfiles.bio,
        investorType: investorProfiles.investorType,
        investmentRangeMin: investorProfiles.investmentRangeMin,
      })
      .from(investorProfiles)

    return profiles.map((profile) => {
      const breakdown = this.calculateScore(profile)
      const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

      return {
        userId: profile.userId,
        score,
        breakdown,
        badge: this.getBadge(score),
      }
    })
  }

  static async getLowCredibilityInvestors(
    threshold = 30,
  ): Promise<InvestorCredibilityScore[]> {
    const allInvestors = await this.getAllInvestorsCredibility()
    return allInvestors.filter((inv) => inv.score < threshold)
  }
}
