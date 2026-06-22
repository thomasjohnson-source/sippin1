import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const rows = await sql`SELECT * FROM contacts ORDER BY company, name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const { name, company, email, phone, address, notes } = await req.json()
  const [row] = await sql`
    INSERT INTO contacts (name, company, email, phone, address, notes)
    VALUES (${name}, ${company ?? ''}, ${email ?? ''}, ${phone ?? ''}, ${address ?? ''}, ${notes ?? ''})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}
