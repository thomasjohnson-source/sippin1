import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { today } from '@/lib/utils'

export async function POST(req: NextRequest) {
  await requireAuth()
  const { type, item_id, quantity_change, reason } = await req.json()
  if (type === 'product') {
    await sql`UPDATE products SET current_stock = current_stock + ${quantity_change} WHERE id = ${item_id}`
    await sql`INSERT INTO inventory_adjustments (product_id, quantity_change, reason, date) VALUES (${item_id}, ${quantity_change}, ${reason}, ${today()})`
  } else {
    await sql`UPDATE ingredients SET current_stock = current_stock + ${quantity_change} WHERE id = ${item_id}`
    await sql`INSERT INTO inventory_adjustments (ingredient_id, quantity_change, reason, date) VALUES (${item_id}, ${quantity_change}, ${reason}, ${today()})`
  }
  return NextResponse.json({ ok: true })
}
