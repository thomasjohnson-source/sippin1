'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fmt, fmtDate } from '@/lib/utils'

const ORANGE = '#FD8141'
const GREEN  = '#6AC07C'

type DashData = {
  revenueThisMonth: number
  revenueLastMonth: number
  outstanding: { amount: number; count: number }
  cash: number
  lowStock: string[]
  chart: { month: string; revenue: number; expenses: number }[]
  recentTx: { id: number; date: string; description: string; reference: string }[]
  unpaidInvoices: { id: number; invoice_number: string; total: number; due_date: string; status: string; contact_name?: string; contact_company?: string }[]
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border rounded-xl p-5 flex flex-col gap-1" style={{ borderColor: '#E8E2D9' }}>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B6560' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? '#1A1A1A' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: '#6B6560' }}>{sub}</p>}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  draft:   '#6B6560',
  sent:    ORANGE,
  overdue: '#ef4444',
  paid:    GREEN,
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ORANGE, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const revChange = data.revenueLastMonth > 0
    ? ((data.revenueThisMonth - data.revenueLastMonth) / data.revenueLastMonth * 100).toFixed(0)
    : null

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="brand-heading text-4xl" style={{ color: '#1A1A1A' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B6560' }}>Welcome back to OJ Sippin Business.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue This Month" value={fmt(data.revenueThisMonth)}
          sub={revChange ? `${Number(revChange) >= 0 ? '+' : ''}${revChange}% vs last month` : 'No prior data'}
          color={GREEN} />
        <StatCard label="Cash Balance" value={fmt(data.cash)} color="#1A1A1A" />
        <StatCard label="Outstanding Invoices" value={fmt(data.outstanding.amount)}
          sub={`${data.outstanding.count} invoice${data.outstanding.count !== 1 ? 's' : ''}`}
          color={data.outstanding.amount > 0 ? ORANGE : '#1A1A1A'} />
        <StatCard label="Low Stock Alerts" value={String(data.lowStock.length)}
          sub={data.lowStock.length > 0 ? data.lowStock.slice(0, 2).join(', ') + (data.lowStock.length > 2 ? '…' : '') : 'All stocked'}
          color={data.lowStock.length > 0 ? '#ef4444' : '#1A1A1A'} />
      </div>

      <div className="bg-white border rounded-xl p-6" style={{ borderColor: '#E8E2D9' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Revenue vs Expenses — Last 6 Months</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.chart} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B6560' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmt(v as number)} contentStyle={{ borderRadius: 8, border: '1px solid #E8E2D9', fontSize: 13 }} />
            <Bar dataKey="revenue" name="Revenue" fill={GREEN} radius={[3,3,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill={ORANGE} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E2D9' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Open Invoices</h2>
            <Link href="/invoices" className="text-xs font-medium hover:underline" style={{ color: ORANGE }}>View all</Link>
          </div>
          {data.unpaidInvoices.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#6B6560' }}>No open invoices</p>
          ) : (
            <div className="space-y-2">
              {data.unpaidInvoices.map(inv => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between py-2 border-b hover:opacity-80 transition-opacity"
                  style={{ borderColor: '#E8E2D9' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{inv.invoice_number}</p>
                    <p className="text-xs" style={{ color: '#6B6560' }}>
                      {inv.contact_company || inv.contact_name || 'No contact'} · Due {fmtDate(inv.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(inv.total)}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                      background: `${STATUS_COLORS[inv.status]}20`,
                      color: STATUS_COLORS[inv.status],
                    }}>{inv.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E2D9' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Recent Transactions</h2>
            <Link href="/books" className="text-xs font-medium hover:underline" style={{ color: ORANGE }}>View all</Link>
          </div>
          {data.recentTx.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#6B6560' }}>No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E8E2D9' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{tx.description}</p>
                    <p className="text-xs" style={{ color: '#6B6560' }}>{fmtDate(tx.date)}{tx.reference ? ` · ${tx.reference}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
