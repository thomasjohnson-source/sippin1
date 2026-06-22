import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { today, addDays } from '@/lib/utils'

export async function GET(req: NextRequest) {
  await requireAuth()
  const status = new URL(req.url).searchParams.get('status')
  const rows = status
    ? await sql`SELECT i.*, c.name AS contact_name, c.company AS contact_company FROM invoices i LEFT JOIN contacts c ON c.id=i.contact_id WHERE i.status=${status} ORDER BY i.issue_date DESC, i.id DESC`
    : await sql`SELECT i.*, c.name AS contact_name, c.company AS contact_company FROM invoices i LEFT JOIN contacts c ON c.id=i.contact_id ORDER BY i.issue_date DESC, i.id DESC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const [settings] = await sql`SELECT * FROM settings WHERE id = 1`
  const nextNum = settings.next_invoice_number as number
  const invoiceNumber = `INV-${String(nextNum).padStart(4, '0')}`
  await sql`UPDATE settings SET next_invoice_number = next_invoice_number + 1 WHERE id = 1`

  const { contact_id, issue_date, due_date, notes, lines = [] } = await req.json() as {
    contact_id?: number; issue_date?: string; due_date?: string; notes?: string
    lines: { description: string; quantity: number; unit_price: number; product_id?: number }[]
  }

  const taxRate  = Number(settings.invoice_tax_rate)
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const taxAmount = subtotal * taxRate
  const total    = subtotal + taxAmount
  const issueD   = issue_date || today()
  const dueD     = due_date || addDays(issueD, 30)

  const [contact] = contact_id ? await sql`SELECT * FROM contacts WHERE id = ${contact_id}` : [null]

  const row = await sql.begin(async sql => {
    const [inv] = await sql`
      INSERT INTO invoices (invoice_number, contact_id, contact_snapshot, issue_date, due_date, notes, subtotal, tax_rate, tax_amount, total)
      VALUES (${invoiceNumber}, ${contact_id||null}, ${contact ? JSON.stringify(contact) : '{}'}, ${issueD}, ${dueD}, ${notes||String(settings.invoice_notes)}, ${subtotal}, ${taxRate}, ${taxAmount}, ${total})
      RETURNING *
    `
    for (const l of lines) {
      await sql`INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, line_total) VALUES (${inv.id}, ${l.product_id||null}, ${l.description}, ${l.quantity}, ${l.unit_price}, ${l.quantity*l.unit_price})`
    }
    return inv
  })
  return NextResponse.json(row, { status: 201 })
}
