import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const [product] = await sql`SELECT * FROM products WHERE id = ${id}`
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await sql`SELECT * FROM production_runs WHERE product_id = ${id} ORDER BY run_date DESC LIMIT 20`
  const adjustments = await sql`SELECT * FROM inventory_adjustments WHERE product_id = ${id} ORDER BY date DESC LIMIT 20`
  return NextResponse.json({ ...product, recipes: [], runs, adjustments })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const { name, description, unit, unit_cost, unit_cost_override, sale_price, current_stock, low_stock_threshold, active } = await req.json()
  const [row] = await sql`
    UPDATE products SET name=${name}, description=${description??''}, unit=${unit},
      unit_cost=${unit_cost}, unit_cost_override=${unit_cost_override?1:0},
      sale_price=${sale_price}, current_stock=${current_stock}, low_stock_threshold=${low_stock_threshold},
      active=${active?1:0}
    WHERE id=${id} RETURNING *
  `
  return NextResponse.json(row)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  await sql`UPDATE products SET active = 0 WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
