import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const rows = await sql`
    SELECT p.*, COALESCE(SUM(i.cost_per_unit), 0) AS ingredient_cost_total
    FROM products p
    LEFT JOIN ingredients i ON i.product_id = p.id
    GROUP BY p.id
    ORDER BY p.sku
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const { sku, name, description, unit, unit_cost, sale_price, current_stock, low_stock_threshold } = await req.json()
  const [row] = await sql`
    INSERT INTO products (sku, name, description, unit, unit_cost, sale_price, current_stock, low_stock_threshold)
    VALUES (${sku}, ${name}, ${description||''}, ${unit||'can'}, ${unit_cost||0}, ${sale_price||0}, ${current_stock||0}, ${low_stock_threshold||50})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}
