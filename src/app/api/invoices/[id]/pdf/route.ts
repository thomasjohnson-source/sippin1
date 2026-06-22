import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import path from 'path'
import fs from 'fs'

const ORANGE  = '#F47920'
const ORANGE2 = '#D4661A'   // darker orange for depth
const INK     = '#1A1A1A'
const MUTED   = '#6B6560'
const BORDER  = '#E0DAD0'
const CREAM   = '#FFF8F2'   // very warm cream — orange-tinted
const WHITE   = '#FFFFFF'
const TEAL    = '#1B7B5E'

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png')
const HAS_LOGO  = fs.existsSync(LOGO_PATH)

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: INK, backgroundColor: WHITE },

  /* ── White header: logo left, invoice title right ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logoImg:   { width: 150, height: 60, objectFit: 'contain' },
  logoBadge: {
    width: 60, height: 60, backgroundColor: ORANGE, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  logoBadgeText: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 18 },

  headerRight:  { alignItems: 'flex-end' },
  invoiceWord:  { fontFamily: 'Helvetica-Bold', fontSize: 34, color: ORANGE, letterSpacing: 3 },
  invoiceNum:   { fontSize: 11, color: MUTED, marginTop: 3, letterSpacing: 0.5 },

  /* ── Orange stripe ── */
  stripe: { height: 6, backgroundColor: ORANGE },

  /* ── Status badge strip ── */
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 8,
    backgroundColor: CREAM,
  },
  statusPill:  { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText:  { fontFamily: 'Helvetica-Bold', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 },

  /* ── Body ── */
  body: { paddingHorizontal: 48, paddingTop: 28, paddingBottom: 120 },

  /* ── Meta row ── */
  metaRow:     { flexDirection: 'row', marginBottom: 28 },
  metaBlock:   { flex: 1 },
  metaDivider: { width: 1, backgroundColor: BORDER, marginHorizontal: 18 },
  metaLabel:   {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: ORANGE,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7,
  },
  metaName:    { fontFamily: 'Helvetica-Bold', fontSize: 11, color: INK, marginBottom: 3 },
  metaLine:    { color: MUTED, fontSize: 9, marginTop: 2, lineHeight: 1.4 },
  dateGroup:   { marginTop: 14 },

  /* ── Table ── */
  tableHead: {
    flexDirection: 'row', backgroundColor: ORANGE,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 4, marginBottom: 1,
  },
  thTxt: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: WHITE, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowEven: { flexDirection: 'row', backgroundColor: CREAM,  paddingHorizontal: 12, paddingVertical: 10 },
  rowOdd:  { flexDirection: 'row', backgroundColor: WHITE, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  tdDesc:  { flex: 1, fontSize: 9, color: INK },
  tdSku:   { fontSize: 8, color: MUTED, marginTop: 2 },
  tdQty:   { width: 40, textAlign: 'right', fontSize: 9, color: MUTED },
  tdPrice: { width: 76, textAlign: 'right', fontSize: 9, color: MUTED },
  tdTotal: { width: 76, textAlign: 'right', fontSize: 9, color: INK, fontFamily: 'Helvetica-Bold' },

  /* ── Totals ── */
  totalsOuter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, marginBottom: 28 },
  totalsBox:   { width: 230, borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 9 },
  totalBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  totalLabel:  { fontSize: 9, color: MUTED },
  totalVal:    { fontSize: 9, color: INK },
  grandRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: ORANGE,
  },
  grandLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: WHITE },
  grandVal:   { fontFamily: 'Helvetica-Bold', fontSize: 12, color: WHITE },

  /* ── Bottom two-col section ── */
  bottomRow: { flexDirection: 'row', gap: 14 },
  bottomBox: {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6,
    padding: 16, borderTopWidth: 3, borderTopColor: ORANGE,
  },

  howLabel:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: ORANGE, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  payRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  payKey:     { fontSize: 8, color: MUTED, flex: 1 },
  payVal:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: INK, flex: 1, textAlign: 'right' },
  payNote:    { fontSize: 8, color: MUTED, marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' },

  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: ORANGE, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  notesText:  { fontSize: 9, color: MUTED, lineHeight: 1.6 },

  /* ── Footer ── */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: ORANGE2,
    paddingHorizontal: 48, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 8, color: 'rgba(255,255,255,0.75)' },
  footerBold: { fontSize: 8, color: WHITE, fontFamily: 'Helvetica-Bold' },
})

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

type InvLine = { description: string; quantity: number; unit_price: number; sku?: string; product_name?: string }
type InvData = {
  invoice_number: string; status: string; issue_date: string; due_date: string
  subtotal: number; tax_rate: number; tax_amount: number; total: number; notes: string
  contact_name?: string; contact_company?: string; contact_email?: string
  contact_address?: string; contact_phone?: string
  lines: InvLine[]
  settings: {
    company_name: string; company_address: string; company_phone: string
    company_email: string; invoice_terms: string
    bank_account_name: string; bank_name: string; bank_routing: string
    bank_account_number: string; bank_account_type: string; bank_notes: string
  }
}

const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  draft:   { bg: '#E8E2D9', color: '#6B6560' },
  sent:    { bg: ORANGE,    color: WHITE },
  overdue: { bg: '#ef4444', color: WHITE },
  paid:    { bg: TEAL,      color: WHITE },
}

function e(type: unknown, props: Record<string, unknown> | null, ...ch: unknown[]) {
  return React.createElement(type as React.ElementType, props, ...ch)
}

function InvoiceDoc({ inv }: { inv: InvData }) {
  const cs      = inv.settings
  const sp      = STATUS_PILL[inv.status] ?? STATUS_PILL.draft
  const hasBank = !!(cs.bank_routing || cs.bank_account_number || cs.bank_name)
  const hasNotes = !!inv.notes

  return e(Document, { title: inv.invoice_number },
    e(Page, { size: 'LETTER', style: s.page },

      /* ── White header: logo | INVOICE ── */
      e(View, { style: s.header },
        HAS_LOGO
          ? e(Image, { src: LOGO_PATH, style: s.logoImg })
          : e(View, { style: s.logoBadge }, e(Text, { style: s.logoBadgeText }, 'OJ')),

        e(View, { style: s.headerRight },
          e(Text, { style: s.invoiceWord }, 'INVOICE'),
          e(Text, { style: s.invoiceNum }, inv.invoice_number),
        ),
      ),

      /* ── Orange stripe ── */
      e(View, { style: s.stripe }),

      /* ── Status strip ── */
      e(View, { style: s.statusStrip },
        e(View, { style: { ...s.statusPill, backgroundColor: sp.bg } },
          e(Text, { style: { ...s.statusText, color: sp.color } }, inv.status.toUpperCase()),
        ),
      ),

      /* ── Body ── */
      e(View, { style: s.body },

        /* Meta: Bill To | From | Dates */
        e(View, { style: s.metaRow },
          e(View, { style: s.metaBlock },
            e(Text, { style: s.metaLabel }, 'Bill To'),
            e(Text, { style: s.metaName }, inv.contact_company || inv.contact_name || 'No contact specified'),
            inv.contact_company && inv.contact_name ? e(Text, { style: s.metaLine }, inv.contact_name)   : null,
            inv.contact_email   ? e(Text, { style: s.metaLine }, inv.contact_email)   : null,
            inv.contact_address ? e(Text, { style: s.metaLine }, inv.contact_address) : null,
            inv.contact_phone   ? e(Text, { style: s.metaLine }, inv.contact_phone)   : null,
          ),
          e(View, { style: s.metaDivider }),
          e(View, { style: s.metaBlock },
            e(Text, { style: s.metaLabel }, 'From'),
            e(Text, { style: s.metaName }, cs.company_name),
            cs.company_address ? e(Text, { style: s.metaLine }, cs.company_address) : null,
            cs.company_email   ? e(Text, { style: s.metaLine }, cs.company_email)   : null,
            cs.company_phone   ? e(Text, { style: s.metaLine }, cs.company_phone)   : null,
          ),
          e(View, { style: s.metaDivider }),
          e(View, { style: s.metaBlock },
            e(Text, { style: s.metaLabel }, 'Invoice Date'),
            e(Text, { style: { ...s.metaName, fontSize: 10 } }, fmtDate(inv.issue_date)),
            e(View, { style: s.dateGroup },
              e(Text, { style: s.metaLabel }, 'Due Date'),
              e(Text, {
                style: { ...s.metaName, fontSize: 10, color: inv.status === 'overdue' ? '#ef4444' : INK },
              }, fmtDate(inv.due_date)),
              e(Text, { style: { ...s.metaLine, marginTop: 3 } }, cs.invoice_terms),
            ),
          ),
        ),

        /* ── Line items ── */
        e(View, { style: s.tableHead },
          e(Text, { style: { ...s.thTxt, flex: 1 } }, 'Description'),
          e(Text, { style: { ...s.thTxt, width: 40, textAlign: 'right' } }, 'Qty'),
          e(Text, { style: { ...s.thTxt, width: 76, textAlign: 'right' } }, 'Unit Price'),
          e(Text, { style: { ...s.thTxt, width: 76, textAlign: 'right' } }, 'Amount'),
        ),
        ...inv.lines.map((l, i) =>
          e(View, { key: String(i), style: i % 2 === 0 ? s.rowEven : s.rowOdd },
            e(View, { style: { flex: 1 } },
              e(Text, { style: s.tdDesc }, l.description),
              l.sku ? e(Text, { style: s.tdSku }, l.sku) : null,
            ),
            e(Text, { style: s.tdQty   }, String(l.quantity)),
            e(Text, { style: s.tdPrice }, fmt(l.unit_price)),
            e(Text, { style: s.tdTotal }, fmt(l.quantity * l.unit_price)),
          )
        ),

        /* ── Totals ── */
        e(View, { style: s.totalsOuter },
          e(View, { style: s.totalsBox },
            e(View, { style: s.totalRow },
              e(Text, { style: s.totalLabel }, 'Subtotal'),
              e(Text, { style: s.totalVal }, fmt(inv.subtotal)),
            ),
            inv.tax_rate > 0
              ? e(View, { style: { ...s.totalRow, ...s.totalBorder } },
                  e(Text, { style: s.totalLabel }, `Tax (${(inv.tax_rate * 100).toFixed(1)}%)`),
                  e(Text, { style: s.totalVal }, fmt(inv.tax_amount)),
                )
              : null,
            e(View, { style: s.grandRow },
              e(Text, { style: s.grandLabel }, 'Total Due'),
              e(Text, { style: s.grandVal }, fmt(inv.total)),
            ),
          ),
        ),

        /* ── How to Pay + Notes ── */
        (hasBank || hasNotes)
          ? e(View, { style: s.bottomRow },
              hasBank ? e(View, { style: s.bottomBox },
                e(Text, { style: s.howLabel }, 'How to Pay — Bank Transfer'),
                cs.bank_account_name   ? e(View, { style: s.payRow }, e(Text, { style: s.payKey }, 'Account Name'),   e(Text, { style: s.payVal }, cs.bank_account_name))   : null,
                cs.bank_name           ? e(View, { style: s.payRow }, e(Text, { style: s.payKey }, 'Bank'),           e(Text, { style: s.payVal }, cs.bank_name))           : null,
                cs.bank_account_type   ? e(View, { style: s.payRow }, e(Text, { style: s.payKey }, 'Account Type'),   e(Text, { style: s.payVal }, cs.bank_account_type))   : null,
                cs.bank_routing        ? e(View, { style: s.payRow }, e(Text, { style: s.payKey }, 'Routing Number'), e(Text, { style: s.payVal }, cs.bank_routing))        : null,
                cs.bank_account_number ? e(View, { style: s.payRow }, e(Text, { style: s.payKey }, 'Account Number'), e(Text, { style: s.payVal }, cs.bank_account_number)) : null,
                cs.bank_notes          ? e(Text, { style: s.payNote }, cs.bank_notes) : null,
              ) : null,
              hasNotes ? e(View, { style: s.bottomBox },
                e(Text, { style: s.notesLabel }, 'Notes'),
                e(Text, { style: s.notesText }, inv.notes),
              ) : null,
            )
          : null,

      ),

      /* ── Footer ── */
      e(View, { style: s.footer, fixed: true },
        e(Text, { style: s.footerText }, cs.company_name),
        e(Text, { style: { ...s.footerText, flex: 1, textAlign: 'center' } }, cs.company_email || ''),
        e(Text, { style: s.footerBold }, inv.invoice_number),
      ),
    )
  )
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const [invoice] = await sql`
    SELECT i.*, c.name as contact_name, c.company as contact_company, c.email as contact_email,
    c.phone as contact_phone, c.address as contact_address
    FROM invoices i LEFT JOIN contacts c ON c.id=i.contact_id WHERE i.id=${id}
  ` as InvData[]

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  invoice.lines    = await sql`
    SELECT il.*, p.sku FROM invoice_lines il LEFT JOIN products p ON p.id=il.product_id
    WHERE il.invoice_id=${id} ORDER BY il.id
  ` as InvLine[]
  invoice.settings = (await sql`SELECT * FROM settings WHERE id=1`)[0] as InvData['settings']

  const buffer = await renderToBuffer(React.createElement(InvoiceDoc, { inv: invoice }))

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
