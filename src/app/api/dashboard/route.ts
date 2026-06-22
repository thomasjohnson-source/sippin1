import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
  const todayStr  = now.toISOString().split('T')[0]

  // Mark overdue
  await sql`UPDATE invoices SET status='overdue' WHERE status='sent' AND due_date < ${todayStr}`

  const [{ revenue_this_month }] = await sql`
    SELECT COALESCE(SUM(tl.credit),0) AS revenue_this_month FROM transaction_lines tl
    JOIN transactions t ON t.id=tl.transaction_id JOIN accounts a ON a.id=tl.account_id
    WHERE a.type='revenue' AND t.date LIKE ${thisMonth+'%'}
  ` as { revenue_this_month: number }[]

  const [{ revenue_last_month }] = await sql`
    SELECT COALESCE(SUM(tl.credit),0) AS revenue_last_month FROM transaction_lines tl
    JOIN transactions t ON t.id=tl.transaction_id JOIN accounts a ON a.id=tl.account_id
    WHERE a.type='revenue' AND t.date LIKE ${lastMonth+'%'}
  ` as { revenue_last_month: number }[]

  const [{ outstanding, count }] = await sql`
    SELECT COALESCE(SUM(total),0) AS outstanding, COUNT(*)::int AS count FROM invoices WHERE status IN ('sent','overdue')
  ` as { outstanding: number; count: number }[]

  const [{ cash }] = await sql`
    SELECT COALESCE(SUM(tl.debit)-SUM(tl.credit),0) AS cash FROM transaction_lines tl
    JOIN accounts a ON a.id=tl.account_id WHERE a.code='1000'
  ` as { cash: number }[]

  const lowProducts = await sql`SELECT name FROM products WHERE current_stock <= low_stock_threshold AND active=1`

  // 6-month chart
  const months = []
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m  = dt.toISOString().slice(0, 7)
    const label = dt.toLocaleString('en-US', { month: 'short' })
    const [{ rev }] = await sql`
      SELECT COALESCE(SUM(tl.credit),0) AS rev FROM transaction_lines tl
      JOIN transactions t ON t.id=tl.transaction_id JOIN accounts a ON a.id=tl.account_id
      WHERE a.type='revenue' AND t.date LIKE ${m+'%'}
    ` as { rev: number }[]
    const [{ exp }] = await sql`
      SELECT COALESCE(SUM(tl.debit),0) AS exp FROM transaction_lines tl
      JOIN transactions t ON t.id=tl.transaction_id JOIN accounts a ON a.id=tl.account_id
      WHERE a.type='expense' AND t.date LIKE ${m+'%'}
    ` as { exp: number }[]
    months.push({ month: label, revenue: Number(rev), expenses: Number(exp) })
  }

  const recentTx = await sql`SELECT * FROM transactions ORDER BY date DESC, id DESC LIMIT 8`
  const unpaidInvoices = await sql`
    SELECT i.*, c.name AS contact_name, c.company AS contact_company
    FROM invoices i LEFT JOIN contacts c ON c.id=i.contact_id
    WHERE i.status IN ('sent','overdue','draft') ORDER BY i.due_date ASC LIMIT 10
  `

  return NextResponse.json({
    revenueThisMonth: Number(revenue_this_month),
    revenueLastMonth: Number(revenue_last_month),
    outstanding: { amount: Number(outstanding), count },
    cash: Number(cash),
    lowStock: lowProducts.map((p: { name: string }) => p.name),
    chart: months,
    recentTx,
    unpaidInvoices,
  })
}
