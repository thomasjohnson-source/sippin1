import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  await requireAuth()
  const [row] = await sql`SELECT * FROM settings WHERE id = 1`
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest) {
  await requireAuth()
  const {
    company_name, company_address, company_phone, company_email, company_ein,
    invoice_tax_rate, invoice_terms, invoice_notes,
    bank_account_name, bank_name, bank_routing, bank_account_number, bank_account_type, bank_notes,
  } = await req.json()
  const [row] = await sql`
    UPDATE settings SET
      company_name=${company_name}, company_address=${company_address??''}, company_phone=${company_phone??''},
      company_email=${company_email??''}, company_ein=${company_ein??''},
      invoice_tax_rate=${invoice_tax_rate??0}, invoice_terms=${invoice_terms??'Net 30'}, invoice_notes=${invoice_notes??''},
      bank_account_name=${bank_account_name??''}, bank_name=${bank_name??''}, bank_routing=${bank_routing??''},
      bank_account_number=${bank_account_number??''}, bank_account_type=${bank_account_type??'Checking'}, bank_notes=${bank_notes??''}
    WHERE id = 1 RETURNING *
  `
  return NextResponse.json(row)
}
