import { db } from '@/db'
import * as schema from '@/db/schema/auth'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

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
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
