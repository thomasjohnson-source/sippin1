'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { fmt, fmtDate, today } from '@/lib/utils'

type Account = { id: number; code: string; name: string; type: string }
type TxLine = { id?: number; account_id: number; account_name: string; account_code: string; debit: number; credit: number; memo: string }
type Tx = { id: number; date: string; description: string; reference: string; lines: TxLine[] }

const TYPES: Record<string, string> = {
  asset: 'Asset', liability: 'Liability', equity: 'Equity', revenue: 'Revenue', expense: 'Expense',
}

type ModalLine = { account_id: string; debit: string; credit: string; memo: string }

function JournalModal({ initial, accounts, onClose, onSaved }: {
  initial?: Tx; accounts: Account[]; onClose: () => void; onSaved: () => void
}) {
  const isEdit = !!initial

  const [date, setDate] = useState(initial?.date ?? today())
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [ref,  setRef]  = useState(initial?.reference ?? '')
  const [lines, setLines] = useState<ModalLine[]>(() => {
    if (initial?.lines?.length) {
      return initial.lines.map(l => ({
        account_id: String(l.account_id),
        debit:  l.debit  > 0 ? String(l.debit)  : '',
        credit: l.credit > 0 ? String(l.credit) : '',
        memo: l.memo ?? '',
      }))
    }
    return [
      { account_id: '', debit: '', credit: '', memo: '' },
      { account_id: '', debit: '', credit: '', memo: '' },
    ]
  })
  const [saving, setSaving] = useState(false)

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  const addLine    = () => setLines(p => [...p, { account_id: '', debit: '', credit: '', memo: '' }])
  const removeLine = (i: number) => setLines(p => p.filter((_, j) => j !== i))
  const updateLine = (i: number, field: string, val: string) =>
    setLines(p => p.map((l, j) => j === i ? { ...l, [field]: val } : l))

  const save = async () => {
    if (!desc || !balanced) return
    setSaving(true)
    const payload = {
      date, description: desc, reference: ref,
      lines: lines.filter(l => l.account_id).map(l => ({
        account_id: parseInt(l.account_id),
        debit:  parseFloat(l.debit)  || 0,
        credit: parseFloat(l.credit) || 0,
        memo: l.memo,
      })),
    }
    if (isEdit) {
      await fetch(`/api/transactions/${initial!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E8E2D9' }}>
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>
            {isEdit ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: '#6B6560' }}>✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Sale to Whole Foods"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Reference (optional)</label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Invoice #, check #, etc."
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: '#6B6560' }}>
                <th className="text-left pb-2 font-medium">Account</th>
                <th className="text-right pb-2 font-medium w-24">Debit</th>
                <th className="text-right pb-2 font-medium w-24">Credit</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="pr-2 pb-2">
                    <select value={l.account_id} onChange={e => updateLine(i, 'account_id', e.target.value)}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: '#E8E2D9' }}>
                      <option value="">Select account…</option>
                      {Object.entries(TYPES).map(([type, label]) => (
                        <optgroup key={type} label={label}>
                          {accounts.filter(a => a.type === type).map(a => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="pr-2 pb-2 w-24">
                    <input type="number" value={l.debit} onChange={e => updateLine(i, 'debit', e.target.value)}
                      placeholder="0.00" min="0" step="0.01"
                      className="w-full border rounded-lg px-2 py-1.5 text-sm text-right" style={{ borderColor: '#E8E2D9' }} />
                  </td>
                  <td className="pr-2 pb-2 w-24">
                    <input type="number" value={l.credit} onChange={e => updateLine(i, 'credit', e.target.value)}
                      placeholder="0.00" min="0" step="0.01"
                      className="w-full border rounded-lg px-2 py-1.5 text-sm text-right" style={{ borderColor: '#E8E2D9' }} />
                  </td>
                  <td className="pb-2">
                    {lines.length > 2 && (
                      <button onClick={() => removeLine(i)} className="text-xs" style={{ color: '#6B6560' }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-xs font-semibold border-t" style={{ borderColor: '#E8E2D9' }}>
                <td className="pt-2">
                  <button onClick={addLine} className="text-xs" style={{ color: '#FD8141' }}>+ Add line</button>
                </td>
                <td className="text-right pt-2">{fmt(totalDebit)}</td>
                <td className="text-right pt-2">{fmt(totalCredit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>

          {!balanced && totalDebit > 0 && (
            <p className="text-xs text-red-500">
              Debits and credits must balance. Difference: {fmt(Math.abs(totalDebit - totalCredit))}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>Cancel</button>
          <button onClick={save} disabled={!desc || !balanced || saving}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#FD8141' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BooksPage() {
  const [data, setData] = useState<{ rows: Tx[]; total: number; pages: number } | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'new' | Tx | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/transactions?page=${page}&q=${encodeURIComponent(q)}`)
    setData(await res.json())
  }, [page, q])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch('/api/accounts').then(r => r.json()).then(setAccounts) }, [])

  const deleteTx = async (id: number) => {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    load()
  }

  const openEdit = async (id: number) => {
    const res = await fetch(`/api/transactions/${id}`)
    const tx: Tx = await res.json()
    setModal(tx)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="brand-heading text-4xl" style={{ color: '#1A1A1A' }}>Books</h1>
          <div className="flex gap-4 mt-1">
            <span className="text-sm" style={{ color: '#FD8141' }}>Ledger</span>
            <Link href="/books/accounts" className="text-sm hover:underline" style={{ color: '#6B6560' }}>Chart of Accounts</Link>
            <Link href="/books/reports" className="text-sm hover:underline" style={{ color: '#6B6560' }}>Reports</Link>
          </div>
        </div>
        <button onClick={() => setModal('new')}
          className="px-4 py-2 text-sm rounded-xl text-white font-medium"
          style={{ background: '#FD8141' }}>
          + New Entry
        </button>
      </div>

      <div>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
          placeholder="Search transactions…"
          className="w-full border rounded-xl px-4 py-2.5 text-sm"
          style={{ borderColor: '#E8E2D9' }} />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-left px-4 py-3 font-medium">Reference</th>
              <th className="text-right px-4 py-3 font-medium">Debit</th>
              <th className="text-right px-4 py-3 font-medium">Credit</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: '#6B6560' }}>Loading…</td></tr>
            ) : data.rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: '#6B6560' }}>No transactions yet</td></tr>
            ) : data.rows.map(tx => {
              const debit  = tx.lines.reduce((s, l) => s + l.debit,  0)
              const credit = tx.lines.reduce((s, l) => s + l.credit, 0)
              return (
                <tr key={tx.id} className="border-b hover:bg-orange-50/30 transition-colors" style={{ borderColor: '#E8E2D9' }}>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#6B6560' }}>{fmtDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: '#1A1A1A' }}>{tx.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
                      {tx.lines.map(l => l.account_code).filter(Boolean).join(', ')}
                    </p>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#6B6560' }}>{tx.reference}</td>
                  <td className="px-4 py-3 text-right" style={{ color: '#1A1A1A' }}>{debit  > 0 ? fmt(debit)  : ''}</td>
                  <td className="px-4 py-3 text-right" style={{ color: '#1A1A1A' }}>{credit > 0 ? fmt(credit) : ''}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(tx.id)}
                      className="text-xs hover:underline mr-3" style={{ color: '#6B6560' }}>Edit</button>
                    <button onClick={() => deleteTx(tx.id)}
                      className="text-xs hover:underline" style={{ color: '#ef4444' }}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40" style={{ borderColor: '#E8E2D9' }}>← Prev</button>
          <span className="text-sm" style={{ color: '#6B6560' }}>Page {page} of {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40" style={{ borderColor: '#E8E2D9' }}>Next →</button>
        </div>
      )}

      {modal && (
        <JournalModal
          initial={modal === 'new' ? undefined : modal as Tx}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
