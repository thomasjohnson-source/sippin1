'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fmt, fmtDate, today, addDays } from '@/lib/utils'

type Line = { id?: number; description: string; quantity: number; unit_price: number; product_id?: number }
type Contact = { id: number; name: string; company: string; email: string; phone: string; address: string }
type Product = { id: number; sku: string; name: string; sale_price: number; current_stock: number; unit: string }
type Settings = { company_name: string; company_address: string; company_phone: string; company_email: string; invoice_tax_rate: number; invoice_notes: string; invoice_terms: string }
type Invoice = {
  id: number; invoice_number: string; status: string; issue_date: string; due_date: string
  subtotal: number; tax_rate: number; tax_amount: number; total: number; notes: string
  contact_id?: number; contact_name?: string; contact_company?: string; contact_email?: string
  contact_address?: string; contact_phone?: string
  lines: Line[]; settings: Settings
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:   { bg: '#E8E2D9', text: '#6B6560' },
  sent:    { bg: '#FEF3E8', text: '#F47920' },
  overdue: { bg: '#FEE2E2', text: '#ef4444' },
  paid:    { bg: '#DCFCE7', text: '#1B7B5E' },
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [contactId, setContactId] = useState<number | ''>('')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(addDays(today(), 30))
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([{ description: '', quantity: 1, unit_price: 0 }])

  const load = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}`)
    if (!res.ok) { router.push('/invoices'); return }
    const data: Invoice = await res.json()
    setInvoice(data)
    setContactId(data.contact_id ?? '')
    setIssueDate(data.issue_date)
    setDueDate(data.due_date)
    setNotes(data.notes ?? '')
    setLines(data.lines?.length > 0 ? data.lines : [{ description: '', quantity: 1, unit_price: 0 }])
    setDirty(false)
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/contacts').then(r => r.json()).then(setContacts)
    fetch('/api/products').then(r => r.json()).then(setProducts)
  }, [])

  const markDirty = () => setDirty(true)

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const taxRate = invoice?.settings.invoice_tax_rate ?? 0
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  const addLine = () => { setLines(p => [...p, { description: '', quantity: 1, unit_price: 0 }]); markDirty() }
  const removeLine = (i: number) => { setLines(p => p.filter((_, j) => j !== i)); markDirty() }
  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines(p => p.map((l, j) => j === i ? { ...l, ...patch } : l))
    markDirty()
  }

  const selectProduct = (i: number, productId: number | '') => {
    if (!productId) {
      updateLine(i, { product_id: undefined })
      return
    }
    const p = products.find(p => p.id === Number(productId))
    if (p) updateLine(i, { product_id: p.id, description: p.name, unit_price: p.sale_price })
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: contactId || undefined,
        issue_date: issueDate, due_date: dueDate, notes,
        lines: lines.filter(l => l.description),
      }),
    })
    setSaving(false)
    setDirty(false)
    await load()
  }

  const markStatus = async (status: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  const deleteInvoice = async () => {
    const msg = invoice?.status === 'paid'
      ? 'This invoice is paid. Deleting it will NOT reverse accounting entries or restore inventory. Delete anyway?'
      : 'Delete this invoice? This cannot be undone.'
    if (!confirm(msg)) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    router.push('/invoices')
  }

  if (!invoice) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F47920', borderTopColor: 'transparent' }} />
    </div>
  )

  const s = invoice.settings
  const colors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft
  const isEditable = invoice.status === 'draft'
  const contact = contacts.find(c => c.id === Number(contactId))

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/invoices')} className="text-sm hover:underline" style={{ color: '#6B6560' }}>← Invoices</button>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{invoice.invoice_number}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: colors.bg, color: colors.text }}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isEditable && dirty && (
            <button onClick={save} disabled={saving}
              className="px-3 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
              style={{ background: '#1B7B5E' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {invoice.status === 'draft' && (
            <button onClick={() => save().then(() => markStatus('sent'))}
              className="px-3 py-2 text-sm rounded-lg text-white font-medium"
              style={{ background: '#F47920' }}>
              Mark Sent
            </button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button onClick={() => markStatus('paid')}
              className="px-3 py-2 text-sm rounded-lg text-white font-medium"
              style={{ background: '#1B7B5E' }}>
              Mark Paid
            </button>
          )}
          <a href={`/api/invoices/${id}/pdf`} target="_blank"
            className="px-3 py-2 text-sm rounded-lg border font-medium inline-flex items-center gap-1.5"
            style={{ borderColor: '#E8E2D9', color: '#1A1A1A' }}>
            ↓ PDF
          </a>
          <button onClick={deleteInvoice}
            className="px-3 py-2 text-sm rounded-lg border font-medium"
            style={{ borderColor: '#E8E2D9', color: '#ef4444' }}>
            Delete
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="bg-white border rounded-xl p-8 space-y-8" style={{ borderColor: '#E8E2D9' }}>
        {/* From / Invoice title */}
        <div className="flex justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-black" style={{ background: '#F47920', color: '#fff' }}>OJ</div>
              <span className="font-bold text-sm" style={{ color: '#1A1A1A' }}>{s.company_name}</span>
            </div>
            {s.company_address && <p className="text-xs" style={{ color: '#6B6560' }}>{s.company_address}</p>}
            {s.company_email   && <p className="text-xs" style={{ color: '#6B6560' }}>{s.company_email}</p>}
            {s.company_phone   && <p className="text-xs" style={{ color: '#6B6560' }}>{s.company_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>INVOICE</p>
            <p className="text-sm font-mono mt-1" style={{ color: '#6B6560' }}>{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Bill To + Dates */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Bill To</p>
            {isEditable ? (
              <select value={contactId} onChange={e => { setContactId(Number(e.target.value) || ''); markDirty() }}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }}>
                <option value="">No contact</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            ) : (
              contact
                ? <div>
                    <p className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{contact.company || contact.name}</p>
                    {contact.company && contact.name && <p className="text-xs" style={{ color: '#6B6560' }}>{contact.name}</p>}
                    {contact.email   && <p className="text-xs" style={{ color: '#6B6560' }}>{contact.email}</p>}
                    {contact.address && <p className="text-xs" style={{ color: '#6B6560' }}>{contact.address}</p>}
                  </div>
                : <p className="text-sm" style={{ color: '#6B6560' }}>{invoice.contact_company || invoice.contact_name || '—'}</p>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Issue Date</p>
              {isEditable
                ? <input type="date" value={issueDate} onChange={e => { setIssueDate(e.target.value); markDirty() }}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
                : <p className="text-sm" style={{ color: '#1A1A1A' }}>{fmtDate(invoice.issue_date)}</p>}
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Due Date</p>
              {isEditable
                ? <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); markDirty() }}
                    className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
                : <p className="text-sm" style={{ color: invoice.status === 'overdue' ? '#ef4444' : '#1A1A1A' }}>{fmtDate(invoice.due_date)}</p>}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                <th className="text-left pb-2 font-medium">Item</th>
                <th className="text-right pb-2 font-medium w-20">Qty</th>
                <th className="text-right pb-2 font-medium w-28">Unit Price</th>
                <th className="text-right pb-2 font-medium w-28">Total</th>
                {isEditable && <th className="w-6" />}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b" style={{ borderColor: '#E8E2D9' }}>
                  <td className="py-2 pr-3">
                    {isEditable ? (
                      <div className="space-y-1">
                        {/* Product picker */}
                        <select
                          value={l.product_id ?? ''}
                          onChange={e => selectProduct(i, e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full border rounded px-2 py-1 text-xs"
                          style={{ borderColor: '#E8E2D9', color: '#6B6560', background: '#FDFAF5' }}>
                          <option value="">— Custom item —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} · {p.name} ({fmt(p.sale_price)}) · {p.current_stock} in stock
                            </option>
                          ))}
                        </select>
                        {/* Description */}
                        <input
                          value={l.description}
                          onChange={e => updateLine(i, { description: e.target.value })}
                          placeholder="Description…"
                          className="w-full border-0 outline-none text-sm bg-transparent"
                          style={{ color: '#1A1A1A' }}
                        />
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: '#1A1A1A' }}>{l.description}</span>
                        {l.product_id && (
                          <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
                            {products.find(p => p.id === l.product_id)?.sku ?? ''}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2 w-20">
                    {isEditable
                      ? <input type="number" value={l.quantity} min="0" step="any"
                          onChange={e => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full border-0 outline-none text-sm text-right bg-transparent" style={{ color: '#1A1A1A' }} />
                      : <span className="block text-right" style={{ color: '#1A1A1A' }}>{l.quantity}</span>}
                  </td>
                  <td className="py-2 pr-2 w-28">
                    {isEditable
                      ? <input type="number" value={l.unit_price} min="0" step="0.01"
                          onChange={e => updateLine(i, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="w-full border-0 outline-none text-sm text-right bg-transparent" style={{ color: '#1A1A1A' }} />
                      : <span className="block text-right" style={{ color: '#1A1A1A' }}>{fmt(l.unit_price)}</span>}
                  </td>
                  <td className="py-2 text-right w-28 font-medium" style={{ color: '#1A1A1A' }}>{fmt(l.quantity * l.unit_price)}</td>
                  {isEditable && (
                    <td className="py-2 pl-1">
                      {lines.length > 1 && (
                        <button onClick={() => removeLine(i)} className="text-xs" style={{ color: '#6B6560' }}>✕</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {isEditable && (
            <button onClick={addLine} className="mt-3 text-xs font-medium hover:underline" style={{ color: '#F47920' }}>
              + Add line item
            </button>
          )}
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: '#6B6560' }}>Subtotal</span>
              <span style={{ color: '#1A1A1A' }}>{fmt(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span style={{ color: '#6B6560' }}>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span style={{ color: '#1A1A1A' }}>{fmt(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: '#E8E2D9' }}>
              <span style={{ color: '#1A1A1A' }}>Total</span>
              <span style={{ color: '#F47920' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Notes</p>
          {isEditable
            ? <textarea value={notes} onChange={e => { setNotes(e.target.value); markDirty() }} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: '#E8E2D9' }} />
            : <p className="text-sm" style={{ color: '#6B6560' }}>{invoice.notes || '—'}</p>}
        </div>
      </div>
    </div>
  )
}
