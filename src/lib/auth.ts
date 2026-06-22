import { getIronSession, IronSessionData } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

declare module 'iron-session' {
  interface IronSessionData {
    authenticated?: boolean
  }
}

const sessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-secret-change-this-now-32c',
  cookieName: 'ojs_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
}

export async function getSession() {
  return getIronSession<IronSessionData>(await cookies(), sessionOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.authenticated) redirect('/login')
  return session
}

export function checkPassword(input: string) {
  return input === (process.env.APP_PASSWORD ?? 'ojsippin2024')
}
