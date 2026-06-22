import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const { name, unit, batch_price, cans_per_batch, product_id, current_stock, low_stock_threshold } = await req.json()
  const bp = batch_price ?? 0
  const cp = cans_per_batch ?? 0
  const cost_per_unit = cp > 0 ? bp / cp : 0
  const [row] = await sql`
    UPDATE ingredients
    SET name=${name}, unit=${unit}, batch_price=${bp}, cans_per_batch=${cp}, cost_per_unit=${cost_per_unit},
        product_id=${product_id||null}, current_stock=${current_stock??0}, low_stock_threshold=${low_stock_threshold??100}
    WHERE id=${id} RETURNING *
  `
  return NextResponse.json(row)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  await sql`DELETE FROM ingredients WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
