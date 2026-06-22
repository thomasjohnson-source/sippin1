import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { today } from '@/lib/utils'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit
  const q = searchParams.get('q') ?? ''

  const [{ count }] = await (q
    ? sql`SELECT COUNT(*)::int AS count FROM transactions t WHERE t.description ILIKE ${'%'+q+'%'} OR t.reference ILIKE ${'%'+q+'%'}`
    : sql`SELECT COUNT(*)::int AS count FROM transactions t`) as { count: number }[]

  const rows = q
    ? await sql`
        SELECT t.*, COALESCE(json_agg(json_build_object(
          'id', tl.id, 'account_id', tl.account_id, 'account_name', a.name,
          'account_code', a.code, 'account_type', a.type,
          'debit', tl.debit, 'credit', tl.credit, 'memo', tl.memo
        )) FILTER (WHERE tl.id IS NOT NULL), '[]') AS lines
        FROM transactions t
        LEFT JOIN transaction_lines tl ON tl.transaction_id = t.id
        LEFT JOIN accounts a ON a.id = tl.account_id
        WHERE t.description ILIKE ${'%'+q+'%'} OR t.reference ILIKE ${'%'+q+'%'}
        GROUP BY t.id
        ORDER BY t.date DESC, t.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT t.*, COALESCE(json_agg(json_build_object(
          'id', tl.id, 'account_id', tl.account_id, 'account_name', a.name,
          'account_code', a.code, 'account_type', a.type,
          'debit', tl.debit, 'credit', tl.credit, 'memo', tl.memo
        )) FILTER (WHERE tl.id IS NOT NULL), '[]') AS lines
        FROM transactions t
        LEFT JOIN transaction_lines tl ON tl.transaction_id = t.id
        LEFT JOIN accounts a ON a.id = tl.account_id
        GROUP BY t.id
        ORDER BY t.date DESC, t.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `

  return NextResponse.json({ rows, total: count, page, pages: Math.ceil(count / limit) })
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const { description, reference, date, lines } = await req.json() as {
    description: string; reference: string; date: string
    lines: { account_id: number; debit: number; credit: number; memo: string }[]
  }
  const row = await sql.begin(async sql => {
    const [tx] = await sql`
      INSERT INTO transactions (date, description, reference) VALUES (${date||today()}, ${description}, ${reference||''}) RETURNING *
    `
    for (const line of lines) {
      await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit, memo) VALUES (${tx.id}, ${line.account_id}, ${line.debit||0}, ${line.credit||0}, ${line.memo||''})`
    }
    return tx
  })
  return NextResponse.json(row, { status: 201 })
}
