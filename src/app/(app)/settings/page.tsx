'use client'
import { useEffect, useState } from 'react'

type Settings = {
  company_name: string; company_address: string; company_phone: string
  company_email: string; company_ein: string; invoice_tax_rate: number
  invoice_terms: string; invoice_notes: string
  bank_account_name: string; bank_name: string; bank_routing: string
  bank_account_number: string; bank_account_type: string; bank_notes: string
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6560' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border rounded-xl px-4 py-2.5 text-sm" style={{ borderColor: '#E8E2D9' }} />
    </div>
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setForm)
  }, [])

  const set = (k: keyof Settings, v: string | number) => {
    setSaved(false)
    setForm(p => p ? { ...p, [k]: v } : p)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
  }

  if (!form) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FD8141', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="brand-heading text-4xl" style={{ color: '#1A1A1A' }}>Settings</h1>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 text-sm rounded-xl text-white font-medium disabled:opacity-50"
          style={{ background: '#FD8141' }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      {/* Company info */}
      <div className="bg-white border rounded-xl p-6 space-y-4" style={{ borderColor: '#E8E2D9' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Company Information</h2>
        <Field label="Company Name" value={form.company_name} onChange={v => set('company_name', v)} placeholder="OJ Sippin Inc." />
        <Field label="Address" value={form.company_address} onChange={v => set('company_address', v)} placeholder="123 Main St, City, State 00000" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" value={form.company_phone} onChange={v => set('company_phone', v)} placeholder="(555) 000-0000" />
          <Field label="Email" value={form.company_email} onChange={v => set('company_email', v)} placeholder="hello@ojsippin.com" />
        </div>
        <Field label="EIN / Tax ID" value={form.company_ein} onChange={v => set('company_ein', v)} placeholder="00-0000000" />
      </div>

      {/* Bank transfer / payment info */}
      <div className="bg-white border rounded-xl p-6 space-y-4" style={{ borderColor: '#E8E2D9' }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Bank Transfer Details</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>Printed in the "How to Pay" section of every invoice PDF.</p>
        </div>
        <Field label="Account Holder Name" value={form.bank_account_name} onChange={v => set('bank_account_name', v)} placeholder="OJ Sippin Inc." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bank Name" value={form.bank_name} onChange={v => set('bank_name', v)} placeholder="Chase, Wells Fargo…" />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6560' }}>Account Type</label>
            <select value={form.bank_account_type} onChange={e => set('bank_account_type', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm" style={{ borderColor: '#E8E2D9' }}>
              <option>Checking</option>
              <option>Savings</option>
              <option>Business Checking</option>
              <option>Business Savings</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Routing Number" value={form.bank_routing} onChange={v => set('bank_routing', v)} placeholder="021000021" />
          <Field label="Account Number" value={form.bank_account_number} onChange={v => set('bank_account_number', v)} placeholder="000123456789" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6560' }}>Additional Payment Instructions (optional)</label>
          <textarea value={form.bank_notes} onChange={e => set('bank_notes', e.target.value)} rows={2}
            placeholder="e.g. Please include invoice number in the memo line."
            className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" style={{ borderColor: '#E8E2D9' }} />
        </div>
      </div>

      {/* Invoice defaults */}
      <div className="bg-white border rounded-xl p-6 space-y-4" style={{ borderColor: '#E8E2D9' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Invoice Defaults</h2>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6560' }}>Tax Rate (%)</label>
          <input type="number" min="0" max="100" step="0.001"
            value={form.invoice_tax_rate * 100}
            onChange={e => set('invoice_tax_rate', parseFloat(e.target.value) / 100 || 0)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm" style={{ borderColor: '#E8E2D9' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6560' }}>Payment Terms</label>
          <select value={form.invoice_terms} onChange={e => set('invoice_terms', e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm" style={{ borderColor: '#E8E2D9' }}>
            {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on receipt'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6560' }}>Default Invoice Notes</label>
          <textarea value={form.invoice_notes} onChange={e => set('invoice_notes', e.target.value)} rows={3}
            className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" style={{ borderColor: '#E8E2D9' }} />
        </div>
      </div>

      {/* Access */}
      <div className="bg-white border rounded-xl p-6" style={{ borderColor: '#E8E2D9' }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>Access</h2>
        <p className="text-sm" style={{ color: '#6B6560' }}>
          To change the login password, update <code className="bg-gray-100 px-1 rounded text-xs">APP_PASSWORD</code> in <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> and restart.
        </p>
      </div>
    </div>
  )
}
