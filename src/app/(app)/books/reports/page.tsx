'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fmt, fmtDate } from '@/lib/utils'

type ReportRow = { code: string; name: string; balance: number }
type ReportData = {
  from: string; to: string
  pnl: { revenue: ReportRow[]; expenses: ReportRow[]; totalRevenue: number; totalExpenses: number; netIncome: number }
  balanceSheet: {
    assets: ReportRow[]; liabilities: ReportRow[]; equity: ReportRow[]
    totalAssets: number; totalLiabilities: number; totalEquity: number
  }
  cashflow: { date: string; description: string; debit: number; credit: number }[]
}

function Section({ title, rows, total, totalLabel, color }: {
  title: string; rows: ReportRow[]; total: number; totalLabel: string; color: string
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color }}>{title}</h3>
      <table className="w-full text-sm mb-3">
        <tbody>
          {rows.map(r => (
            <tr key={r.code}>
              <td className="py-1 font-mono text-xs w-12" style={{ color: '#6B6560' }}>{r.code}</td>
              <td className="py-1" style={{ color: '#1A1A1A' }}>{r.name}</td>
              <td className="py-1 text-right" style={{ color: '#1A1A1A' }}>{fmt(r.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold" style={{ borderColor: '#E8E2D9' }}>
            <td colSpan={2} className="pt-2" style={{ color: '#1A1A1A' }}>{totalLabel}</td>
            <td className="pt-2 text-right" style={{ color }}>{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

const now = new Date()
const DEFAULT_FROM = `${now.getFullYear()}-01-01`
const DEFAULT_TO = now.toISOString().split('T')[0]

export default function ReportsPage() {
  const [tab, setTab] = useState<'pnl'|'balance'|'cashflow'>('pnl')
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    setData(null)
    fetch(`/api/reports?from=${from}&to=${to}`).then(r => r.json()).then(setData)
  }, [from, to])

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Reports</h1>
        <div className="flex gap-4 mt-1">
          <Link href="/books" className="text-sm hover:underline" style={{ color: '#6B6560' }}>Ledger</Link>
          <Link href="/books/accounts" className="text-sm hover:underline" style={{ color: '#6B6560' }}>Accounts</Link>
          <span className="text-sm" style={{ color: '#1B7B5E' }}>Reports</span>
        </div>
      </div>

      {/* Date range + tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
        <span className="text-sm" style={{ color: '#6B6560' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
        <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
          {(['pnl', 'balance', 'cashflow'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-2 text-sm font-medium transition-colors"
              style={{ background: tab === t ? '#1B7B5E' : 'white', color: tab === t ? '#fff' : '#6B6560' }}>
              {t === 'pnl' ? 'P&L' : t === 'balance' ? 'Balance Sheet' : 'Cash Flow'}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F47920', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-6" style={{ borderColor: '#E8E2D9' }}>
          {tab === 'pnl' && (
            <>
              <h2 className="text-base font-bold mb-4" style={{ color: '#1A1A1A' }}>Profit & Loss</h2>
              <p className="text-xs mb-4" style={{ color: '#6B6560' }}>{fmtDate(data.from)} — {fmtDate(data.to)}</p>
              <Section title="Revenue" rows={data.pnl.revenue} total={data.pnl.totalRevenue} totalLabel="Total Revenue" color="#1B7B5E" />
              <Section title="Expenses" rows={data.pnl.expenses} total={data.pnl.totalExpenses} totalLabel="Total Expenses" color="#F47920" />
              <div className="border-t pt-4 mt-2" style={{ borderColor: '#E8E2D9' }}>
                <div className="flex justify-between font-bold text-base">
                  <span style={{ color: '#1A1A1A' }}>Net Income</span>
                  <span style={{ color: data.pnl.netIncome >= 0 ? '#1B7B5E' : '#ef4444' }}>{fmt(data.pnl.netIncome)}</span>
                </div>
              </div>
            </>
          )}

          {tab === 'balance' && (
            <>
              <h2 className="text-base font-bold mb-4" style={{ color: '#1A1A1A' }}>Balance Sheet</h2>
              <p className="text-xs mb-4" style={{ color: '#6B6560' }}>As of {fmtDate(data.to)}</p>
              <Section title="Assets" rows={data.balanceSheet.assets} total={data.balanceSheet.totalAssets} totalLabel="Total Assets" color="#1B7B5E" />
              <Section title="Liabilities" rows={data.balanceSheet.liabilities} total={data.balanceSheet.totalLiabilities} totalLabel="Total Liabilities" color="#ef4444" />
              <Section title="Equity" rows={data.balanceSheet.equity} total={data.balanceSheet.totalEquity} totalLabel="Total Equity" color="#6366f1" />
              <div className="border-t pt-4 mt-2" style={{ borderColor: '#E8E2D9' }}>
                <div className="flex justify-between font-semibold text-sm">
                  <span style={{ color: '#6B6560' }}>Liabilities + Equity</span>
                  <span style={{ color: '#1A1A1A' }}>{fmt(data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity)}</span>
                </div>
              </div>
            </>
          )}

          {tab === 'cashflow' && (
            <>
              <h2 className="text-base font-bold mb-4" style={{ color: '#1A1A1A' }}>Cash Flow</h2>
              <p className="text-xs mb-4" style={{ color: '#6B6560' }}>Cash account activity {fmtDate(data.from)} — {fmtDate(data.to)}</p>
              {data.cashflow.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: '#6B6560' }}>No cash transactions in this period</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs border-b" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                      <th className="text-left pb-2 font-medium">Date</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                      <th className="text-right pb-2 font-medium">In</th>
                      <th className="text-right pb-2 font-medium">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cashflow.map((r, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: '#E8E2D9' }}>
                        <td className="py-2" style={{ color: '#6B6560' }}>{fmtDate(r.date)}</td>
                        <td className="py-2" style={{ color: '#1A1A1A' }}>{r.description}</td>
                        <td className="py-2 text-right" style={{ color: '#1B7B5E' }}>{r.debit > 0 ? fmt(r.debit) : ''}</td>
                        <td className="py-2 text-right" style={{ color: '#ef4444' }}>{r.credit > 0 ? fmt(r.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold" style={{ borderColor: '#E8E2D9' }}>
                      <td colSpan={2} className="pt-2" style={{ color: '#1A1A1A' }}>Net Cash Flow</td>
                      <td colSpan={2} className="pt-2 text-right" style={{ color: '#1A1A1A' }}>
                        {fmt(data.cashflow.reduce((s, r) => s + r.debit - r.credit, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
