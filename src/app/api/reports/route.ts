import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await requireAuth()
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? `${new Date().getFullYear()}-01-01`
  const to   = searchParams.get('to')   ?? new Date().toISOString().split('T')[0]

  const balances = await sql`
    SELECT a.id, a.code, a.name, a.type,
      COALESCE(SUM(tl.debit),0)  AS total_debit,
      COALESCE(SUM(tl.credit),0) AS total_credit
    FROM accounts a
    LEFT JOIN transaction_lines tl ON tl.account_id = a.id
    LEFT JOIN transactions t ON t.id = tl.transaction_id AND t.date BETWEEN ${from} AND ${to}
    GROUP BY a.id, a.code, a.name, a.type
    ORDER BY a.code
  ` as { id:number; code:string; name:string; type:string; total_debit:number; total_credit:number }[]

  const balance = (type: string) =>
    balances.filter(r => r.type === type).map(r => ({
      ...r,
      balance: ['asset','expense'].includes(type) ? Number(r.total_debit) - Number(r.total_credit) : Number(r.total_credit) - Number(r.total_debit),
    }))

  const revenue     = balance('revenue')
  const expenses    = balance('expense')
  const liabilities = balance('liability')
  const equity      = balance('equity')
  const totalRevenue  = revenue.reduce((s, r) => s + r.balance, 0)
  const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0)
  const netIncome = totalRevenue - totalExpenses

  // Actual physical inventory value (current_stock × effective cost per unit)
  const [invRow] = await sql`
    SELECT COALESCE(SUM(p.current_stock *
      CASE WHEN p.unit_cost_override = 1 THEN p.unit_cost
           ELSE COALESCE((SELECT SUM(i.cost_per_unit) FROM ingredients i WHERE i.product_id = p.id), 0)
      END), 0) AS inventory_value
    FROM products p
  `
  const physicalInventoryValue = Number(invRow?.inventory_value ?? 0)

  // Override 1310 Inventory—Finished Goods with actual physical stock value
  const assets = balance('asset').map(r =>
    r.code === '1310' ? { ...r, balance: physicalInventoryValue } : r
  )

  const cashflow = await sql`
    SELECT t.date, t.description, tl.debit, tl.credit
    FROM transaction_lines tl
    JOIN transactions t ON t.id = tl.transaction_id
    JOIN accounts a ON a.id = tl.account_id
    WHERE a.code = '1000' AND t.date BETWEEN ${from} AND ${to}
    ORDER BY t.date ASC
  `

  return NextResponse.json({
    from, to,
    pnl: { revenue, expenses, totalRevenue, totalExpenses, netIncome },
    balanceSheet: {
      assets, liabilities,
      equity: [...equity, { code: 'NET', name: 'Net Income', type: 'equity', balance: netIncome, total_debit: 0, total_credit: 0 }],
      totalAssets: assets.reduce((s, r) => s + r.balance, 0),
      totalLiabilities: liabilities.reduce((s, r) => s + r.balance, 0),
      totalEquity: equity.reduce((s, r) => s + r.balance, 0) + netIncome,
    },
    cashflow,
  })
}
