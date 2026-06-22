import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const [tx] = await sql`SELECT * FROM transactions WHERE id = ${id}`
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const lines = await sql`
    SELECT tl.*, a.name AS account_name, a.code AS account_code, a.type AS account_type
    FROM transaction_lines tl JOIN accounts a ON a.id = tl.account_id WHERE tl.transaction_id = ${id}
  `
  return NextResponse.json({ ...tx, lines })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const { date, description, reference, lines } = await req.json() as {
    date: string; description: string; reference: string
    lines: { account_id: number; debit: number; credit: number; memo: string }[]
  }
  await sql.begin(async sql => {
    await sql`UPDATE transactions SET date=${date}, description=${description}, reference=${reference||''} WHERE id=${id}`
    await sql`DELETE FROM transaction_lines WHERE transaction_id = ${id}`
    for (const line of lines) {
      await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit, memo) VALUES (${id}, ${line.account_id}, ${line.debit||0}, ${line.credit||0}, ${line.memo||''})`
    }
  })
  const [tx] = await sql`SELECT * FROM transactions WHERE id = ${id}`
  const updatedLines = await sql`
    SELECT tl.*, a.name AS account_name, a.code AS account_code, a.type AS account_type
    FROM transaction_lines tl JOIN accounts a ON a.id = tl.account_id WHERE tl.transaction_id = ${id}
  `
  return NextResponse.json({ ...tx, lines: updatedLines })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  await sql.begin(async sql => {
    // Check if this is a payment transaction linked to an invoice
    const [invoice] = await sql`SELECT * FROM invoices WHERE transaction_id = ${id}`

    if (invoice) {
      // Restore inventory for each product line
      const lines = await sql`SELECT product_id, quantity FROM invoice_lines WHERE invoice_id = ${invoice.id} AND product_id IS NOT NULL`
      for (const line of lines) {
        await sql`UPDATE products SET current_stock = current_stock + ${line.quantity} WHERE id = ${line.product_id}`
        await sql`DELETE FROM inventory_adjustments WHERE product_id = ${line.product_id} AND reason = ${'Sold — Invoice ' + invoice.invoice_number}`
      }
      // Delete associated COGS transaction
      await sql`DELETE FROM transactions WHERE reference = ${invoice.invoice_number} AND description LIKE 'COGS%'`
      // Reset invoice to sent
      await sql`UPDATE invoices SET status='sent', paid_at=NULL, transaction_id=NULL WHERE id = ${invoice.id}`
    }

    await sql`DELETE FROM transactions WHERE id = ${id}`
  })

  return NextResponse.json({ ok: true })
}
