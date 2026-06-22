'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { fmt } from '@/lib/utils'

type Product = {
  id: number; sku: string; name: string; description: string; unit: string
  unit_cost: number; unit_cost_override: number; sale_price: number
  current_stock: number; low_stock_threshold: number; active: number
  ingredient_cost_total: number
}
type Ingredient = {
  id: number; name: string; unit: string
  batch_price: number; cans_per_batch: number; cost_per_unit: number
  product_id: number | null
  current_stock: number; low_stock_threshold: number
}

function EditableNumber({
  value, onSave, prefix = '', suffix = '', decimals = 2,
}: { value: number; onSave: (v: number) => void; prefix?: string; suffix?: string; decimals?: number }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const start = () => { setDraft(String(value)); setEditing(true) }
  const commit = () => {
    setEditing(false)
    const n = parseFloat(draft)
    if (!isNaN(n) && n !== value) onSave(n)
  }

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  if (editing) return (
    <input ref={inputRef} type="number" value={draft} min="0" step="any"
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      className="w-full text-right rounded px-2 py-0.5 text-sm outline-none"
      style={{ border: '1.5px solid #F47920', minWidth: 0 }}
    />
  )

  return (
    <button onClick={start} title="Click to edit"
      className="w-full text-right rounded px-1 py-0.5 text-sm transition-colors hover:bg-orange-50 group relative"
      style={{ color: '#1A1A1A' }}>
      {prefix}{value.toFixed(decimals)}{suffix}
      <span className="absolute -top-0.5 -right-0.5 text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: '#F47920', fontSize: 8 }}>✎</span>
    </button>
  )
}

function ProductModal({ initial, onClose, onSaved }: {
  initial?: Product; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    sku: initial?.sku ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    unit: initial?.unit ?? 'can',
    unit_cost: initial?.unit_cost ?? 0,
    sale_price: initial?.sale_price ?? 0,
    current_stock: initial?.current_stock ?? 0,
    low_stock_threshold: initial?.low_stock_threshold ?? 50,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.sku || !form.name) return
    setSaving(true)
    await fetch(initial ? `/api/products/${initial.id}` : '/api/products', {
      method: initial ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, active: true }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E8E2D9' }}>
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>{initial ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} style={{ color: '#6B6560' }}>✕</button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>SKU *</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. OJS-OG-12"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Unit</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="can, case, bottle…"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Product Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="OJ Sippin Original 12oz"
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Sale Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.sale_price}
                onChange={e => set('sale_price', parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Current Stock</label>
              <input type="number" min="0" value={form.current_stock}
                onChange={e => set('current_stock', parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Low Stock Alert (cans)</label>
            <input type="number" min="0" value={form.low_stock_threshold}
              onChange={e => set('low_stock_threshold', parseFloat(e.target.value) || 0)}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>Cancel</button>
          <button onClick={save} disabled={!form.sku || !form.name || saving}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#1B7B5E' }}>
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IngredientModal({ initial, products, onClose, onSaved }: {
  initial?: Ingredient; products: Product[]; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    unit: initial?.unit ?? 'each',
    batch_price: initial?.batch_price ?? 0,
    cans_per_batch: initial?.cans_per_batch ?? 0,
    product_id: initial?.product_id ?? null as number | null,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string | number | null) => setForm(p => ({ ...p, [k]: v }))

  const costPerCan = form.cans_per_batch > 0 ? form.batch_price / form.cans_per_batch : 0

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    await fetch(initial ? `/api/ingredients/${initial.id}` : '/api/ingredients', {
      method: initial ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        current_stock: initial?.current_stock ?? 0,
        low_stock_threshold: initial?.low_stock_threshold ?? 100,
      }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E8E2D9' }}>
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>{initial ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
          <button onClick={onClose} style={{ color: '#6B6560' }}>✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Ingredient Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Orange Juice"
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Assign to SKU</label>
            <select
              value={form.product_id ?? ''}
              onChange={e => set('product_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }}>
              <option value="">— Not assigned —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Unit label <span style={{ color: '#9B9591' }}>(optional)</span></label>
            <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="each"
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
          </div>
          <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: '#E8E2D9', background: '#FDFAF5' }}>
            <p className="text-xs font-semibold" style={{ color: '#6B6560' }}>Batch Purchase</p>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Total order price ($)</label>
              <input type="number" min="0" step="0.01" value={form.batch_price || ''}
                onChange={e => set('batch_price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Cans produced from this order</label>
              <input type="number" min="0" step="1" value={form.cans_per_batch || ''}
                onChange={e => set('cans_per_batch', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
            </div>
            {costPerCan > 0 && (
              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#E8E2D9' }}>
                <span className="text-xs font-medium" style={{ color: '#6B6560' }}>Cost per can</span>
                <span className="text-sm font-bold" style={{ color: '#F47920' }}>{fmt(costPerCan)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>Cancel</button>
          <button onClick={save} disabled={!form.name || saving}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#1B7B5E' }}>
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Ingredient'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ item, onClose, onDone }: {
  item: Product; onClose: () => void; onDone: () => void
}) {
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!qty || !reason) return
    setSaving(true)
    await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'product', item_id: item.id, quantity_change: parseFloat(qty), reason }),
    })
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Adjust Stock — {item.name}</h2>
          <button onClick={onClose} style={{ color: '#6B6560' }}>✕</button>
        </div>
        <p className="text-sm" style={{ color: '#6B6560' }}>Current: {item.current_stock} {item.unit}</p>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Change (negative to reduce)</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} step="any"
            placeholder="+50 or -12"
            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Reason</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Received shipment, shrinkage…"
            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>Cancel</button>
          <button onClick={save} disabled={!qty || !reason || saving}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#F47920' }}>
            {saving ? 'Saving…' : 'Adjust'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductionModal({ products, onClose, onDone }: {
  products: Product[]; onClose: () => void; onDone: () => void
}) {
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!productId || !qty) return
    setSaving(true)
    await fetch('/api/production-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: parseInt(productId), quantity_produced: parseInt(qty), notes }),
    })
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Log Production Run</h2>
          <button onClick={onClose} style={{ color: '#6B6560' }}>✕</button>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Product</label>
          <select value={productId} onChange={e => setProductId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Quantity Produced</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" placeholder="24"
            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6560' }}>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E8E2D9' }} />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>Cancel</button>
          <button onClick={save} disabled={!productId || !qty || saving}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#1B7B5E' }}>
            {saving ? 'Saving…' : 'Log Run'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [tab, setTab] = useState<'products' | 'ingredients'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [productModal, setProductModal] = useState<'new' | Product | null>(null)
  const [ingredientModal, setIngredientModal] = useState<'new' | Ingredient | null>(null)
  const [adjustItem, setAdjustItem] = useState<Product | null>(null)
  const [showProduction, setShowProduction] = useState(false)

  const loadProducts = useCallback(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
  }, [])
  const loadIngredients = useCallback(() => {
    fetch('/api/ingredients').then(r => r.json()).then(setIngredients)
  }, [])

  useEffect(() => { loadProducts(); loadIngredients() }, [loadProducts, loadIngredients])

  const updateProductSalePrice = async (id: number, value: number) => {
    const product = products.find(p => p.id === id)
    if (!product) return
    setProducts(prev => prev.map(p => p.id === id ? { ...p, sale_price: value } : p))
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, sale_price: value, active: true }),
    })
  }

  // Manually override unit cost — sets override flag
  const overrideUnitCost = async (id: number, value: number) => {
    const product = products.find(p => p.id === id)
    if (!product) return
    setProducts(prev => prev.map(p => p.id === id ? { ...p, unit_cost: value, unit_cost_override: 1 } : p))
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, unit_cost: value, unit_cost_override: 1, active: true }),
    })
  }

  // Reset to ingredient-calculated cost
  const resetUnitCost = async (id: number) => {
    const product = products.find(p => p.id === id)
    if (!product) return
    setProducts(prev => prev.map(p => p.id === id ? { ...p, unit_cost_override: 0 } : p))
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, unit_cost_override: 0, active: true }),
    })
  }

  const updateIngredientBatch = async (id: number, field: 'batch_price' | 'cans_per_batch', value: number) => {
    const ing = ingredients.find(i => i.id === id)
    if (!ing) return
    const updated = { ...ing, [field]: value }
    const cost_per_unit = updated.cans_per_batch > 0 ? updated.batch_price / updated.cans_per_batch : 0
    setIngredients(prev => prev.map(i => i.id === id ? { ...updated, cost_per_unit } : i))
    await fetch(`/api/ingredients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updated, cost_per_unit }),
    })
    // Refresh products so ingredient_cost_total updates
    loadProducts()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Inventory</h1>
        <div className="flex gap-2">
          {tab === 'products' && (
            <>
              <button onClick={() => setShowProduction(true)}
                className="px-3 py-2 text-sm rounded-xl border font-medium"
                style={{ borderColor: '#1B7B5E', color: '#1B7B5E' }}>
                + Log Production
              </button>
              <button onClick={() => setProductModal('new')}
                className="px-3 py-2 text-sm rounded-xl text-white font-medium"
                style={{ background: '#1B7B5E' }}>
                + Add Product
              </button>
            </>
          )}
          {tab === 'ingredients' && (
            <button onClick={() => setIngredientModal('new')}
              className="px-3 py-2 text-sm rounded-xl text-white font-medium"
              style={{ background: '#1B7B5E' }}>
              + Add Ingredient
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b" style={{ borderColor: '#E8E2D9' }}>
        {(['products', 'ingredients'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors"
            style={{
              borderColor: tab === t ? '#F47920' : 'transparent',
              color: tab === t ? '#F47920' : '#6B6560',
            }}>
            {t === 'products' ? `Products (${products.length})` : `Ingredients (${ingredients.length})`}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
          {products.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#6B6560' }}>
              <p className="text-3xl mb-2">⊞</p>
              <p className="text-sm mb-3">No products yet.</p>
              <button onClick={() => setProductModal('new')}
                className="px-4 py-2 text-sm rounded-xl text-white font-medium"
                style={{ background: '#1B7B5E' }}>
                + Add your first product
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                  <th className="text-left px-4 py-3 font-medium">SKU</th>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-right px-4 py-3 font-medium">Stock</th>
                  <th className="text-right px-4 py-3 font-medium w-36">Cost / Can</th>
                  <th className="text-right px-4 py-3 font-medium w-28">Sale Price</th>
                  <th className="text-right px-4 py-3 font-medium w-20">Margin</th>
                  <th className="text-right px-4 py-3 font-medium w-20" />
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const low = p.current_stock <= p.low_stock_threshold
                  const effectiveCost = p.unit_cost_override ? p.unit_cost : p.ingredient_cost_total
                  const margin = p.sale_price > 0
                    ? ((p.sale_price - effectiveCost) / p.sale_price * 100)
                    : 0
                  const hasIngredients = p.ingredient_cost_total > 0

                  return (
                    <tr key={p.id} className="border-b hover:bg-orange-50/30 transition-colors" style={{ borderColor: '#E8E2D9' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6B6560' }}>{p.sku}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>{p.name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={low ? 'font-semibold' : ''} style={{ color: low ? '#ef4444' : '#1A1A1A' }}>
                          {p.current_stock}
                        </span>
                        {low && <span className="ml-1 text-xs" style={{ color: '#ef4444' }}>low</span>}
                      </td>

                      {/* Smart cost cell */}
                      <td className="px-2 py-1 w-36">
                        <EditableNumber
                          value={effectiveCost}
                          onSave={v => overrideUnitCost(p.id, v)}
                          prefix="$"
                        />
                        <div className="flex items-center justify-end gap-1 mt-0.5 min-h-[14px]">
                          {p.unit_cost_override ? (
                            <>
                              <span className="text-xs" style={{ color: '#9B9591' }}>manual</span>
                              {hasIngredients && (
                                <button onClick={() => resetUnitCost(p.id)}
                                  title={`Reset to ingredient total: ${fmt(p.ingredient_cost_total)}`}
                                  className="text-xs hover:underline" style={{ color: '#F47920' }}>
                                  ↺ auto
                                </button>
                              )}
                            </>
                          ) : hasIngredients ? (
                            <span className="text-xs" style={{ color: '#1B7B5E' }}>from ingredients</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-2 py-2 w-28">
                        <EditableNumber value={p.sale_price} onSave={v => updateProductSalePrice(p.id, v)} prefix="$" />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold w-20"
                        style={{ color: margin >= 50 ? '#1B7B5E' : margin >= 25 ? '#F47920' : '#ef4444' }}>
                        {margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setProductModal(p)} className="text-xs mr-2 hover:underline" style={{ color: '#6B6560' }}>Edit</button>
                        <button onClick={() => setAdjustItem(p)} className="text-xs hover:underline" style={{ color: '#F47920' }}>Adjust</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'ingredients' && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#6B6560' }}>
            Enter the total price paid and cans produced per order — cost per can is calculated automatically and rolls up into each assigned SKU.
          </p>
          <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8E2D9' }}>
            {ingredients.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#6B6560' }}>
                <p className="text-3xl mb-2">⊞</p>
                <p className="text-sm mb-3">No ingredients yet.</p>
                <button onClick={() => setIngredientModal('new')}
                  className="px-4 py-2 text-sm rounded-xl text-white font-medium"
                  style={{ background: '#1B7B5E' }}>
                  + Add your first ingredient
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs" style={{ borderColor: '#E8E2D9', color: '#6B6560' }}>
                    <th className="text-left px-4 py-3 font-medium">Ingredient</th>
                    <th className="text-left px-4 py-3 font-medium">SKU</th>
                    <th className="text-right px-4 py-3 font-medium w-36">Order Price</th>
                    <th className="text-right px-4 py-3 font-medium w-36">Cans / Order</th>
                    <th className="text-right px-4 py-3 font-medium w-32">Cost / Can</th>
                    <th className="text-right px-4 py-3 font-medium w-16" />
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(ing => {
                    const costPerCan = ing.cans_per_batch > 0 ? ing.batch_price / ing.cans_per_batch : 0
                    const assignedProduct = products.find(p => p.id === ing.product_id)
                    return (
                      <tr key={ing.id} className="border-b hover:bg-orange-50/30 transition-colors" style={{ borderColor: '#E8E2D9' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>{ing.name}</td>
                        <td className="px-4 py-3">
                          {assignedProduct ? (
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium"
                              style={{ background: '#FEF3E8', color: '#F47920' }}>
                              {assignedProduct.sku}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: '#9B9591' }}>—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 w-36">
                          <EditableNumber
                            value={ing.batch_price}
                            onSave={v => updateIngredientBatch(ing.id, 'batch_price', v)}
                            prefix="$"
                          />
                        </td>
                        <td className="px-2 py-2 w-36">
                          <EditableNumber
                            value={ing.cans_per_batch}
                            onSave={v => updateIngredientBatch(ing.id, 'cans_per_batch', v)}
                            decimals={0}
                          />
                        </td>
                        <td className="px-4 py-3 text-right w-32 font-semibold"
                          style={{ color: costPerCan > 0 ? '#F47920' : '#9B9591' }}>
                          {costPerCan > 0 ? fmt(costPerCan) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setIngredientModal(ing)} className="text-xs hover:underline" style={{ color: '#6B6560' }}>Edit</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {productModal && (
        <ProductModal
          initial={productModal === 'new' ? undefined : productModal as Product}
          onClose={() => setProductModal(null)}
          onSaved={loadProducts}
        />
      )}
      {ingredientModal && (
        <IngredientModal
          initial={ingredientModal === 'new' ? undefined : ingredientModal as Ingredient}
          products={products}
          onClose={() => setIngredientModal(null)}
          onSaved={() => { loadIngredients(); loadProducts() }}
        />
      )}
      {adjustItem && (
        <AdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onDone={loadProducts}
        />
      )}
      {showProduction && (
        <ProductionModal
          products={products}
          onClose={() => setShowProduction(false)}
          onDone={loadProducts}
        />
      )}
    </div>
  )
}
