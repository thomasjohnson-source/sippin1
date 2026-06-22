'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fmt } from '@/lib/utils'

type Account = {
  id: number; code: string; name: string; type: string; description: string
  total_debit: number; total_credit: number
}

const TYPE_ORDER = ['asset', 'liability', 'equity', 'revenue', 'expense']
const TYPE_LABELS: Record<string, string> = {
  asset: 'Assets', liability: 'Liabilities', equity: 'Equity',
  revenue: 'Revenue', expense: 'Expenses',
}
const TYPE_COLORS: Record<string, string> = {
  asset: '#6AC07C', liability: '#ef4444', equity: '#6366f1',
  revenue: '#FD8141', expense: '#6B6560',
}

function balance(a: Account): number {
  if (a.type === 'asset' || a.type === 'expense') return a.total_debit - a.total_credit
  return a.total_credit - a.total_debit
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="brand-heading text-4xl" style={{ color: '#1A1A1A' }}>Chart of Accounts</h1>
        <div className="flex gap-4 mt-1">
          <Link href="/books" className="text-sm hover:underline" style={{ color: '#6B6560' }}>Ledger</Link>
          <span className="text-sm" style={{ color: '#FD8141' }}>Accounts</span>
          <Link href="/books/reports" className="text-sm hover:underline" style={{ color: '#6B6560' }}>Reports</Link>
        </div>
      </div>

      {TYPE_ORDER.map(type => {
        const group = accounts.filter(a => a.type === type)
        if (!group.length) return null
        const total = group.reduce((s, a) => s + balance(a), 0)
        return (
          <div key={type} className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E8E2D9', background: '#FDFAF5' }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: TYPE_COLORS[type] }}>
                {TYPE_LABELS[type]}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{fmt(total)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {group.map(a => (
                  <tr key={a.id} className="border-b last:border-0" style={{ borderColor: '#E8E2D9' }}>
                    <td className="px-4 py-3 w-16 font-mono text-xs" style={{ color: '#6B6560' }}>{a.code}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>{a.name}</td>
                    <td className="px-4 py-3 text-right" style={{ color: '#1A1A1A' }}>{fmt(balance(a))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
