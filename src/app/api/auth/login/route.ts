import { NextRequest, NextResponse } from 'next/server'
import { getSession, checkPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const session = await getSession()
  session.authenticated = true
  await session.save()
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}
