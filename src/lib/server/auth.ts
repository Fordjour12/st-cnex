import { cookies, createServerFn } from '@tanstack/react-start/server'

import { auth } from '@/lib/auth'

const COOKIE_NAME = 'better-auth.session_token'

export const signIn = createServerFn({
  method: 'POST',
})
  .validator((data: { email: string; password: string }) => data)
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
  .validator((data: { email: string; password: string; name: string }) => data)
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
