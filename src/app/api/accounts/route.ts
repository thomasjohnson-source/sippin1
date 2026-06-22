import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const rows = await sql`
    SELECT a.*,
      COALESCE(SUM(tl.debit),0)  AS total_debit,
      COALESCE(SUM(tl.credit),0) AS total_credit
    FROM accounts a
    LEFT JOIN transaction_lines tl ON tl.account_id = a.id
    GROUP BY a.id
    ORDER BY a.code
  `
  return NextResponse.json(rows)
}
