import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '@/lib/auth'
import { RBACService } from '@/lib/server/rbac'

export const signIn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()

    const session = await auth.api.signInEmail({
      headers,
      body: {
        email: data.email,
        password: data.password,
      },
    })

    return { session }
  })

export const signUp = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: { email: string; password: string; name: string }) => data,
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()

    const session = await auth.api.signUpEmail({
      headers,
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    })

    return { session }
  })

export const signOut = createServerFn({
  method: 'POST',
}).handler(async () => {
  const headers = getRequestHeaders()

  await auth.api.signOut({ headers })

  return { success: true }
})

export const getSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const headers = getRequestHeaders()

  const session = await auth.api.getSession({ headers })

  return { session: session ?? null }
})

export const getSessionWithRole = createServerFn({
  method: 'GET',
}).handler(async () => {
  const headers = getRequestHeaders()

  const session = await auth.api.getSession({ headers })

  if (!session) {
    return { session: null, isAdmin: false }
  }

  const isAdmin = await RBACService.isAdmin(session.user.id)

  return { session, isAdmin }
})
