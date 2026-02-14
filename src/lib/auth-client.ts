import { createAuthClient } from 'better-auth/client'
import { adminClient, organizationClient } from 'better-auth/client/plugins'

const baseURL = typeof window !== 'undefined' ? window.location.origin : ''

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    adminClient(),
    organizationClient({
      teams: {
        enabled: true,
      },
      schema: {
        organization: {
          additionalFields: {
            type: {
              type: 'string',
              input: true,
              required: true,
              defaultValue: 'startup',
            },
          },
        },
      },
    }),
  ],
})

export const { admin, organization } = authClient

export type OrganizationType = 'startup' | 'investor' | 'accelerator'

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
  return authClient.signIn.email({
    email: data.email,
    password: data.password,
  })
}

export async function clientSignUp(data: SignUpData) {
  return authClient.signUp.email({
    email: data.email,
    password: data.password,
    name: data.name,
  })
}

export async function clientSignOut() {
  return authClient.signOut()
}

export async function clientGetSession() {
  return authClient.getSession()
}
