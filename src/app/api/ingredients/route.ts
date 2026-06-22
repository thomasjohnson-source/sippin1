import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const rows = await sql`SELECT * FROM ingredients ORDER BY name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const { name, unit, batch_price, cans_per_batch, product_id, current_stock, low_stock_threshold } = await req.json()
  const bp = batch_price || 0
  const cp = cans_per_batch || 0
  const cost_per_unit = cp > 0 ? bp / cp : 0
  const [row] = await sql`
    INSERT INTO ingredients (name, unit, batch_price, cans_per_batch, cost_per_unit, product_id, current_stock, low_stock_threshold)
    VALUES (${name}, ${unit??'each'}, ${bp}, ${cp}, ${cost_per_unit}, ${product_id||null}, ${current_stock||0}, ${low_stock_threshold||100})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}
