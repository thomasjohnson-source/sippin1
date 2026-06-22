import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { today } from '@/lib/utils'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const [invoice] = await sql`
    SELECT i.*, c.name AS contact_name, c.company AS contact_company, c.email AS contact_email,
    c.phone AS contact_phone, c.address AS contact_address
    FROM invoices i LEFT JOIN contacts c ON c.id=i.contact_id WHERE i.id=${id}
  `
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const lines = await sql`SELECT il.*, p.sku, p.name AS product_name FROM invoice_lines il LEFT JOIN products p ON p.id=il.product_id WHERE il.invoice_id=${id}`
  const [settings] = await sql`SELECT * FROM settings WHERE id = 1`
  return NextResponse.json({ ...invoice, lines, settings })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const body = await req.json()

  if (body.status === 'paid') {
    const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${id}`
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await sql.begin(async sql => {
      // Atomic update — only proceeds if status is still not paid
      const [locked] = await sql`UPDATE invoices SET status='paid', paid_at=${today()} WHERE id=${id} AND status != 'paid' RETURNING *`
      if (!locked) return // already paid, skip everything

      const [arAcct]  = await sql`SELECT id FROM accounts WHERE code='1100'`
      const [cashAcct] = await sql`SELECT id FROM accounts WHERE code='1000'`
      const [revAcct]  = await sql`SELECT id FROM accounts WHERE code='4000'`
      const [cogsAcct] = await sql`SELECT id FROM accounts WHERE code='5000'`
      const [invAcct]  = await sql`SELECT id FROM accounts WHERE code='1310'`

      // Payment entry
      const [tx] = await sql`
        INSERT INTO transactions (date, description, reference) VALUES (${today()}, ${`Invoice ${invoice.invoice_number} — payment received`}, ${invoice.invoice_number}) RETURNING *
      `
      await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit) VALUES (${tx.id}, ${cashAcct.id}, ${invoice.total}, 0)`
      await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit) VALUES (${tx.id}, ${arAcct.id}, 0, ${invoice.total})`
      await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit) VALUES (${tx.id}, ${revAcct.id}, 0, ${invoice.subtotal})`
      await sql`UPDATE invoices SET transaction_id=${tx.id} WHERE id=${id}`

      // COGS + inventory deduction
      const productLines = await sql`
        SELECT il.product_id, il.quantity, p.unit_cost, p.unit_cost_override,
          COALESCE((SELECT SUM(i2.cost_per_unit) FROM ingredients i2 WHERE i2.product_id=p.id), 0) AS ingredient_cost_total
        FROM invoice_lines il JOIN products p ON p.id=il.product_id
        WHERE il.invoice_id=${id} AND il.product_id IS NOT NULL
      ` as { product_id: number; quantity: number; unit_cost: number; unit_cost_override: number; ingredient_cost_total: number }[]

      let totalCogs = 0
      for (const line of productLines) {
        const effectiveCost = line.unit_cost_override ? Number(line.unit_cost) : Number(line.ingredient_cost_total)
        totalCogs += Number(line.quantity) * effectiveCost
        await sql`UPDATE products SET current_stock=current_stock-${line.quantity} WHERE id=${line.product_id}`
        await sql`INSERT INTO inventory_adjustments (product_id, quantity_change, reason, date) VALUES (${line.product_id}, ${-line.quantity}, ${`Sold — Invoice ${invoice.invoice_number}`}, ${today()})`
      }
      if (totalCogs > 0) {
        const [cogsTx] = await sql`
          INSERT INTO transactions (date, description, reference) VALUES (${today()}, ${`COGS — Invoice ${invoice.invoice_number}`}, ${invoice.invoice_number}) RETURNING *
        `
        await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit) VALUES (${cogsTx.id}, ${cogsAcct.id}, ${totalCogs}, 0)`
        await sql`INSERT INTO transaction_lines (transaction_id, account_id, debit, credit) VALUES (${cogsTx.id}, ${invAcct.id}, 0, ${totalCogs})`
      }
    })
    const [updated] = await sql`SELECT * FROM invoices WHERE id=${id}`
    return NextResponse.json(updated)
  }

  if (body.status === 'sent') {
    const [row] = await sql`UPDATE invoices SET status='sent' WHERE id=${id} RETURNING *`
    return NextResponse.json(row)
  }

  // Full edit (draft)
  const { contact_id, issue_date, due_date, notes, lines } = body as {
    contact_id?: number; issue_date: string; due_date: string; notes?: string
    lines: { description: string; quantity: number; unit_price: number; product_id?: number }[]
  }
  const [settings] = await sql`SELECT * FROM settings WHERE id=1`
  const taxRate   = Number(settings.invoice_tax_rate)
  const subtotal  = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const taxAmount = subtotal * taxRate
  const total     = subtotal + taxAmount
  const [contact] = contact_id ? await sql`SELECT * FROM contacts WHERE id=${contact_id}` : [null]

  await sql.begin(async sql => {
    await sql`
      UPDATE invoices SET contact_id=${contact_id||null}, contact_snapshot=${contact?JSON.stringify(contact):'{}'},
        issue_date=${issue_date}, due_date=${due_date}, notes=${notes??''},
        subtotal=${subtotal}, tax_rate=${taxRate}, tax_amount=${taxAmount}, total=${total}
      WHERE id=${id}
    `
    await sql`DELETE FROM invoice_lines WHERE invoice_id=${id}`
    for (const l of lines) {
      await sql`INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, line_total) VALUES (${id}, ${l.product_id||null}, ${l.description}, ${l.quantity}, ${l.unit_price}, ${l.quantity*l.unit_price})`
    }
  })
  const [row] = await sql`SELECT * FROM invoices WHERE id=${id}`
  return NextResponse.json(row)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  await sql`DELETE FROM invoices WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
