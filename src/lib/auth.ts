import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db'
import * as schema from '@/db/schema/auth'

const corsOrigin = process.env.CORS_ORIGIN

if (!corsOrigin) {
  throw new Error('CORS_ORIGIN is not set')
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',

    schema: schema,
  }),
  trustedOrigins: [corsOrigin],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin(), tanstackStartCookies()],
})
