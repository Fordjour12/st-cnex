import { createAuthClient } from 'better-auth/client'
import { adminClient } from 'better-auth/client/plugins'

const baseURL = typeof window !== 'undefined' ? window.location.origin : ''

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
})

export const { admin } = authClient

export type SignInData = {
  email: string
  password: string
}

export type SignUpData = {
  email: string
  password: string
  name: string
}

export async function clientSignIn(data: SignInData) {
  const { signIn } = await import('@/lib/server/auth')
  return signIn({ data })
}

export async function clientSignUp(data: SignUpData) {
  const { signUp } = await import('@/lib/server/auth')
  return signUp({ data })
}

export async function clientSignOut() {
  const { signOut } = await import('@/lib/server/auth')
  return signOut({})
}

export async function clientGetSession() {
  const { getSession } = await import('@/lib/server/auth')
  return getSession({})
}
