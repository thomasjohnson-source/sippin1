'use client'
import { useEffect, useState, useCallback } from 'react'

type Contact = {
  id: number; name: string; company: string; email: string
  phone: string; address: string; notes: string
}

function ContactForm({ initial, onSave, onCancel }: {
  initial?: Contact; onSave: (data: Partial<Contact>) => void; onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    company: initial?.company ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    notes: initial?.notes ?? '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E8E2D9' }}>
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>{initial ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onCancel} style={{ color: '#6B6560' }}>✕</button>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: 'Name *', key: 'name', placeholder: 'Full name' },
            { label: 'Company', key: 'company', placeholder: 'Company name' },
            { label: 'Email', key: 'email', placeholder: 'email@example.com' },
            { label: 'Phone', key: 'phone', placeholder: '(555) 000-0000' },
            { label: 'Address', key: 'address', placeholder: '123 Main St, City, ST' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>{label}</label>
              <input value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: '#E8E2D9' }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>Cancel</button>
          <button onClick={() => form.name && onSave(form)} disabled={!form.name}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#1B7B5E' }}>
            {initial ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'new' | Contact | null>(null)

  const load = useCallback(() => {
    fetch(`/api/contacts?q=${encodeURIComponent(q)}`).then(r => r.json()).then(setContacts)
  }, [q])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: Partial<Contact>) => {
    if (typeof modal === 'object' && modal !== null && modal !== modal) return
    const isEdit = typeof modal === 'object' && modal !== null
    await fetch(isEdit ? `/api/contacts/${(modal as Contact).id}` : '/api/contacts', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setModal(null)
    load()
  }

  const deleteContact = async (id: number) => {
    if (!confirm('Delete this contact?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Contacts</h1>
        <button onClick={() => setModal('new')}
          className="px-4 py-2 text-sm rounded-xl text-white font-medium"
          style={{ background: '#1B7B5E' }}>
          + New Contact
        </button>
      </div>

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search contacts…"
        className="w-full border rounded-xl px-4 py-2.5 text-sm" style={{ borderColor: '#E8E2D9' }} />

      <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
        {contacts.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#6B6560' }}>
            <p className="text-3xl mb-2">⊙</p>
            <p className="text-sm">No contacts yet. Add your first customer or vendor.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-b hover:bg-orange-50/30 transition-colors" style={{ borderColor: '#E8E2D9' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>{c.name}</td>
                  <td className="px-4 py-3" style={{ color: '#6B6560' }}>{c.company}</td>
                  <td className="px-4 py-3" style={{ color: '#6B6560' }}>{c.email}</td>
                  <td className="px-4 py-3" style={{ color: '#6B6560' }}>{c.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModal(c)} className="text-xs mr-3 hover:underline" style={{ color: '#F47920' }}>Edit</button>
                    <button onClick={() => deleteContact(c.id)} className="text-xs hover:underline" style={{ color: '#ef4444' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ContactForm
          initial={modal === 'new' ? undefined : modal as Contact}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
