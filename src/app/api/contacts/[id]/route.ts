import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const [row] = await sql`SELECT * FROM contacts WHERE id = ${id}`
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const { name, company, email, phone, address, notes } = await req.json()
  const [row] = await sql`
    UPDATE contacts SET name=${name}, company=${company??''}, email=${email??''}, phone=${phone??''}, address=${address??''}, notes=${notes??''}
    WHERE id=${id} RETURNING *
  `
  return NextResponse.json(row)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  await sql`DELETE FROM contacts WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
