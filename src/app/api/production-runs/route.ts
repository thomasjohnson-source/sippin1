import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { today } from '@/lib/utils'

export async function GET(req: NextRequest) {
  await requireAuth()
  const productId = new URL(req.url).searchParams.get('product_id')
  const rows = productId
    ? await sql`SELECT pr.*, p.name AS product_name, p.sku AS product_sku FROM production_runs pr JOIN products p ON p.id=pr.product_id WHERE pr.product_id=${parseInt(productId)} ORDER BY pr.run_date DESC LIMIT 50`
    : await sql`SELECT pr.*, p.name AS product_name, p.sku AS product_sku FROM production_runs pr JOIN products p ON p.id=pr.product_id ORDER BY pr.run_date DESC LIMIT 50`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const { product_id, quantity_produced, notes, run_date } = await req.json()
  const [product] = await sql`SELECT unit_cost FROM products WHERE id = ${product_id}`
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  const cost_total = quantity_produced * product.unit_cost
  const [row] = await sql.begin(async sql => {
    const [pr] = await sql`
      INSERT INTO production_runs (product_id, quantity_produced, cost_total, run_date, notes)
      VALUES (${product_id}, ${quantity_produced}, ${cost_total}, ${run_date||today()}, ${notes||''})
      RETURNING *
    `
    await sql`UPDATE products SET current_stock = current_stock + ${quantity_produced} WHERE id = ${product_id}`
    return [pr]
  })
  return NextResponse.json(row, { status: 201 })
}
