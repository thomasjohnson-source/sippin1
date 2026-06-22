'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fmt, fmtDate } from '@/lib/utils'

type Invoice = {
  id: number; invoice_number: string; status: string; total: number
  issue_date: string; due_date: string; contact_name?: string; contact_company?: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:   { bg: '#E8E2D9', text: '#6B6560' },
  sent:    { bg: '#FEF3E8', text: '#F47920' },
  overdue: { bg: '#FEE2E2', text: '#ef4444' },
  paid:    { bg: '#DCFCE7', text: '#1B7B5E' },
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    const q = statusFilter ? `?status=${statusFilter}` : ''
    fetch(`/api/invoices${q}`).then(r => r.json()).then(setInvoices)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const createNew = async () => {
    setCreating(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: [{ description: '', quantity: 1, unit_price: 0 }] }),
    })
    const inv = await res.json()
    router.push(`/invoices/${inv.id}`)
  }

  const totals = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    paid: invoices.filter(i => i.status === 'paid').length,
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Invoices</h1>
        <button onClick={createNew} disabled={creating}
          className="px-4 py-2 text-sm rounded-xl text-white font-medium disabled:opacity-50"
          style={{ background: '#F47920' }}>
          {creating ? 'Creating…' : '+ New Invoice'}
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: `All (${totals.all})` },
          { key: 'draft', label: `Draft (${totals.draft})` },
          { key: 'sent', label: `Sent (${totals.sent})` },
          { key: 'overdue', label: `Overdue (${totals.overdue})` },
          { key: 'paid', label: `Paid (${totals.paid})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
            style={{
              background: statusFilter === key ? '#1B7B5E' : '#E8E2D9',
              color: statusFilter === key ? '#fff' : '#6B6560',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
        {invoices.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#6B6560' }}>
            <p className="text-3xl mb-2">⊠</p>
            <p className="text-sm">No invoices yet. Create your first one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Issued</th>
                <th className="text-left px-4 py-3 font-medium">Due</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const colors = STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft
                return (
                  <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}
                    className="border-b hover:bg-orange-50/30 transition-colors cursor-pointer" style={{ borderColor: '#E8E2D9' }}>
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: '#1A1A1A' }}>
                      <Link href={`/invoices/${inv.id}`} onClick={e => e.stopPropagation()} className="hover:underline">{inv.invoice_number}</Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1A1A1A' }}>
                      {inv.contact_company || inv.contact_name || <span style={{ color: '#6B6560' }}>—</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6B6560' }}>{fmtDate(inv.issue_date)}</td>
                    <td className="px-4 py-3" style={{ color: inv.status === 'overdue' ? '#ef4444' : '#6B6560' }}>{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmt(inv.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: colors.bg, color: colors.text }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
