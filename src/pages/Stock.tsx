import { useState } from 'react'
import { Plus, Minus, Pencil, Trash2, PackagePlus, Trash, AlertTriangle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button, Badge, PageHeader, Card } from '../components/ui/core'
import { DataTable, type Col } from '../components/ui/data'
import { Modal } from '../components/ui/overlays'
import { Input, NumberInput, Select } from '../components/ui/forms'
import { money, uid } from '../lib/utils'
import type { Product } from '../store/types'

const CATS = ['Gaming Packages', 'Hot Drinks', 'Cold Drinks', 'Snacks', 'Meals'] as const
const blank: Product = { sku: '', name: '', cat: 'Snacks', cost: 1, price: 2, stock: 10, reorder: 5, emoji: '📦', hue: 220 }

export default function Stock() {
  const s = useStore()
  const [edit, setEdit] = useState<{ p: Product; isNew: boolean } | null>(null), [err, setErr] = useState<Record<string, string>>({})
  const [restock, setRestock] = useState<{ sku: string; qty: number } | null>(null), [waste, setWaste] = useState<{ sku: string; qty: number; reason: string } | null>(null), [tab, setTab] = useState<'inv' | 'waste'>('inv')
  const status = (p: Product) => p.cat === 'Gaming Packages' ? { t: 'Unlimited', tone: 'info' as const } : p.stock <= 0 ? { t: 'Out', tone: 'bad' as const } : p.stock <= p.reorder ? { t: 'Low', tone: 'warn' as const } : { t: 'OK', tone: 'ok' as const }
  const low = s.products.filter(p => status(p).tone === 'warn' || status(p).tone === 'bad')
  const save = () => {
    if (!edit) return
    const e: Record<string, string> = {}, p = edit.p
    if (!p.name.trim()) e.name = 'Name is required'
    if (!p.sku.trim()) e.sku = 'SKU is required'; else if (edit.isNew && s.products.some(x => x.sku === p.sku)) e.sku = 'SKU already exists'
    if (p.price < p.cost) e.price = 'Price is below unit cost'
    setErr(e); if (Object.keys(e).length) return
    s.set({ products: edit.isNew ? [...s.products, p] : s.products.map(x => x.sku === p.sku ? p : x) }); s.toast({ title: edit.isNew ? 'Item added' : 'Item updated', body: p.name, level: 'ok' }); setEdit(null)
  }
  const cols: Col<Product>[] = [
    { key: 'sku', label: 'SKU', render: p => <span className="tnum faint">{p.sku}</span> },
    { key: 'name', label: 'Product', render: p => <span className="flex items-center gap-2 font-semibold"><span className="text-lg">{p.emoji}</span>{p.name}</span> }, { key: 'cat', label: 'Category' },
    { key: 'cost', label: 'Unit cost', render: p => <span className="tnum">{money(p.cost)}</span>, sort: (a, b) => a.cost - b.cost }, { key: 'price', label: 'Retail', render: p => <span className="tnum font-semibold">{money(p.price)}</span>, sort: (a, b) => a.price - b.price },
    { key: 'stock', label: 'Stock', sort: (a, b) => a.stock - b.stock, render: p => p.cat === 'Gaming Packages' ? <span className="faint">∞</span> : <span className="flex items-center gap-1.5"><Button size="sm" icon aria-label={`Decrease ${p.name}`} onClick={() => s.adjustStock(p.sku, -1)}><Minus size={12} /></Button><span className="tnum w-8 text-center font-bold" style={{ color: p.stock <= p.reorder ? 'var(--warn)' : undefined }}>{p.stock}</span><Button size="sm" icon aria-label={`Increase ${p.name}`} onClick={() => s.adjustStock(p.sku, 1)}><Plus size={12} /></Button></span> },
    { key: 'reorder', label: 'Reorder at', render: p => <span className="tnum">{p.cat === 'Gaming Packages' ? '—' : p.reorder}</span> },
    { key: 'status', label: 'Status', render: p => <Badge tone={status(p).tone} dot>{status(p).t}</Badge>, sort: (a, b) => status(a).t.localeCompare(status(b).t) },
    { key: 'act', label: '', render: p => <span className="flex gap-1">
      <Button size="sm" icon v="ghost" aria-label={`Restock ${p.name}`} title="Restock delivery" disabled={p.cat === 'Gaming Packages'} onClick={() => setRestock({ sku: p.sku, qty: 24 })}><PackagePlus size={14} /></Button>
      <Button size="sm" icon v="ghost" aria-label={`Log wastage ${p.name}`} title="Log wastage" disabled={p.cat === 'Gaming Packages'} onClick={() => setWaste({ sku: p.sku, qty: 1, reason: 'Spoiled' })}><Trash size={14} /></Button>
      <Button size="sm" icon v="ghost" aria-label={`Edit ${p.name}`} onClick={() => { setErr({}); setEdit({ p: { ...p }, isNew: false }) }}><Pencil size={14} /></Button>
      <Button size="sm" icon v="ghost" aria-label={`Delete ${p.name}`} onClick={() => s.confirm(`Delete ${p.name}?`, 'This removes the product from inventory and POS.', 'Delete', () => s.set({ products: s.products.filter(x => x.sku !== p.sku) }))}><Trash2 size={14} /></Button></span> },
  ]
  return (
    <div className="page">
      <PageHeader title="Stock & Inventory" sub={`${s.products.length} products · ${low.length} need attention`} />
      {low.length > 0 && <div className="glass-lite !rounded-2xl p-3 mb-3 flex items-center gap-3 text-[13px]"><AlertTriangle size={16} style={{ color: 'var(--warn)' }} /><span className="flex-1"><b>{low.length}</b> items at or below reorder level: {low.slice(0, 4).map(p => p.name).join(', ')}{low.length > 4 && '…'}</span></div>}
      <div className="flex gap-2 mb-3"><Button on={tab === 'inv'} onClick={() => setTab('inv')}>Inventory</Button><Button on={tab === 'waste'} onClick={() => setTab('waste')}>Wastage & spoilage ({s.wastage.length})</Button></div>
      {tab === 'inv' ? <DataTable rows={s.products} cols={cols} rowKey={p => p.sku} search searchKeys={['sku', 'name', 'cat']} toolbar={<Button v="primary" onClick={() => { setErr({}); setEdit({ p: { ...blank, sku: 'NEW-' + uid().slice(0, 4).toUpperCase() }, isNew: true }) }}><Plus size={14} />Add item</Button>} /> :
        <Card title="Wastage log">{s.wastage.length ? <ul className="flex flex-col gap-2">{s.wastage.map((w, i) => <li key={i} className="inset-glass p-3 flex justify-between text-[13px]"><span><b>{s.products.find(p => p.sku === w.sku)?.name}</b> × {w.qty} — {w.reason}</span><span className="faint tnum">{new Date(w.at).toLocaleTimeString()}</span></li>)}</ul> : <div className="sub py-6 text-center">No wastage logged yet. Use the bin icon on an inventory row.</div>}</Card>}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.isNew ? 'Add item' : 'Edit item'} footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button v="primary" onClick={save}>Save</Button></>}>
        {edit && <div className="grid grid-cols-2 gap-3"><Input label="SKU" value={edit.p.sku} disabled={!edit.isNew} error={err.sku} onChange={e => setEdit({ ...edit, p: { ...edit.p, sku: e.target.value.toUpperCase() } })} /><Input label="Emoji" value={edit.p.emoji} onChange={e => setEdit({ ...edit, p: { ...edit.p, emoji: e.target.value } })} />
          <div className="col-span-2"><Input label="Product name" value={edit.p.name} error={err.name} onChange={e => setEdit({ ...edit, p: { ...edit.p, name: e.target.value } })} /></div>
          <div className="col-span-2"><Select label="Category" value={edit.p.cat} onChange={v => setEdit({ ...edit, p: { ...edit.p, cat: v as Product['cat'] } })} options={CATS.map(c => ({ value: c, label: c }))} /></div>
          <NumberInput label="Unit cost" prefix="$" step={.1} value={edit.p.cost} onChange={v => setEdit({ ...edit, p: { ...edit.p, cost: v } })} /><div><NumberInput label="Retail price" prefix="$" step={.1} value={edit.p.price} onChange={v => setEdit({ ...edit, p: { ...edit.p, price: v } })} />{err.price && <p className="text-[11px] mt-1" style={{ color: 'var(--bad)' }}>{err.price}</p>}</div>
          <NumberInput label="Stock" value={edit.p.stock} max={9999} onChange={v => setEdit({ ...edit, p: { ...edit.p, stock: v } })} /><NumberInput label="Reorder threshold" value={edit.p.reorder} onChange={v => setEdit({ ...edit, p: { ...edit.p, reorder: v } })} /></div>}
      </Modal>
      <Modal open={!!restock} onClose={() => setRestock(null)} size="sm" title="Restock delivery" footer={<><Button onClick={() => setRestock(null)}>Cancel</Button><Button v="primary" onClick={() => { s.restock(restock!.sku, restock!.qty); setRestock(null) }}>Receive delivery</Button></>}>{restock && <NumberInput label={`Units received · ${s.products.find(p => p.sku === restock.sku)?.name}`} value={restock.qty} min={1} step={6} onChange={v => setRestock({ ...restock, qty: v })} />}</Modal>
      <Modal open={!!waste} onClose={() => setWaste(null)} size="sm" title="Log wastage" footer={<><Button onClick={() => setWaste(null)}>Cancel</Button><Button v="danger" onClick={() => { s.logWaste(waste!.sku, waste!.qty, waste!.reason); setWaste(null) }}>Log wastage</Button></>}>{waste && <div className="flex flex-col gap-3"><NumberInput label={`Units · ${s.products.find(p => p.sku === waste.sku)?.name}`} value={waste.qty} min={1} onChange={v => setWaste({ ...waste, qty: v })} /><Select label="Reason" value={waste.reason} onChange={v => setWaste({ ...waste, reason: v })} options={['Spoiled', 'Expired', 'Dropped / damaged', 'Staff meal', 'Theft / unknown'].map(v => ({ value: v, label: v }))} /></div>}</Modal>
    </div>
  )
}
