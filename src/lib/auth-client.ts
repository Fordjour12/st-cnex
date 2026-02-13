import { createAuthClient } from 'better-auth/client'
import { adminClient } from 'better-auth/client/plugins'

const baseURL = window.location.origin

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
})

export const { admin } = authClient
