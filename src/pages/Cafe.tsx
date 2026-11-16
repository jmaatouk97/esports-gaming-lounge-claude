import { useMemo, useState } from 'react'
import { ShoppingCart, Map as MapIcon, Minus, Plus, Trash2, Banknote, CreditCard, Wallet, Receipt, Send, Percent, User, Monitor, Check } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button, Glass, Tabs, Badge, Card } from '../components/ui/core'
import { SearchInput, Select, Combobox, NumberInput } from '../components/ui/forms'
import { FloorMap } from '../components/floor/FloorMap'
import { BatchBar } from '../components/floor/Overlays'
import { money } from '../lib/utils'
import type { Product } from '../store/types'
import { cn } from '../lib/utils'

const CATS = ['All', 'Gaming Packages', 'Hot Drinks', 'Cold Drinks', 'Snacks', 'Meals'] as const

export function ProductCard({ p, onAdd }: { p: Product; onAdd: () => void }) {
  const low = p.stock <= p.reorder && p.cat !== 'Gaming Packages', out = p.stock <= 0
  return (
    <button onClick={onAdd} disabled={out} className="glass-lite !rounded-2xl p-3 text-left flex flex-col gap-2 transition-transform duration-150 active:scale-[.97] hover:-translate-y-0.5 focus-ring disabled:opacity-40" aria-label={`Add ${p.name}, ${money(p.price)}`}>
      <div className="h-16 rounded-xl grid place-items-center text-3xl border border-white/10" style={{ background: `linear-gradient(135deg, hsl(${p.hue} 70% 55% / .35), hsl(${p.hue + 40} 70% 45% / .18))` }} aria-hidden>{p.emoji}</div>
      <div className="min-w-0"><div className="text-[13px] font-semibold truncate">{p.name}</div>
        <div className="flex items-center justify-between mt-0.5"><span className="tnum font-bold" style={{ color: 'var(--accent)' }}>{money(p.price)}</span>{p.cat === 'Gaming Packages' ? <span className="badge acc">Time</span> : <span className={cn('text-[10px] font-bold tnum')} style={{ color: out ? 'var(--bad)' : low ? 'var(--warn)' : 'var(--faint)' }}>{out ? 'SOLD OUT' : low ? `Low · ${p.stock}` : `${p.stock} in stock`}</span>}</div></div>
    </button>
  )
}

function POS() {
  const s = useStore()
  const [q, setQ] = useState(''), [cat, setCat] = useState<string>('All')
  const prods = useMemo(() => s.products.filter(p => (cat === 'All' || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [s.products, cat, q])
  const sub = s.cart.reduce((a, c) => a + (s.products.find(p => p.sku === c.sku)?.price ?? 0) * c.qty, 0)
  const disc = sub * (s.cartDiscount / 100), taxable = sub - disc, tax = s.settings.taxIncl ? 0 : taxable * (s.settings.tax / 100), total = taxable + tax
  const mem = s.members.find(m => m.id === s.cartMember)
  const pays = [['Cash', Banknote], ['Card', CreditCard], ['Member Balance', Wallet], ['PC Tab', Receipt]] as const
  return (
    <div className="grid gap-3 h-full lg:grid-cols-[1fr_390px] min-h-0">
      <div className="flex flex-col gap-3 min-h-0">
        <div className="flex flex-wrap gap-2 items-center"><SearchInput className="flex-1 min-w-[180px] max-w-sm" value={q} onChange={setQ} placeholder="Search products…" />
          <div className="noscroll-x overflow-x-auto max-w-full"><Tabs size="sm" value={cat as 'All'} onChange={setCat as never} tabs={CATS.map(c => ({ id: c, label: c }))} /></div></div>
        <div className="overflow-y-auto grid gap-2.5 content-start pb-24 lg:pb-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 flex-1 min-h-0">
          {prods.map(p => <ProductCard key={p.sku} p={p} onAdd={() => s.addToCart(p.sku)} />)}{!prods.length && <div className="col-span-full sub p-8 text-center">No products match.</div>}
        </div>
      </div>
      <Glass className="flex flex-col min-h-0 max-h-full overflow-hidden">
        <div className="p-3.5 grid grid-cols-2 gap-2.5 border-b border-white/10">
          <Select label="Assigned PC" value={s.cartPc} onChange={v => s.set({ cartPc: v })} options={[{ value: '', label: 'Counter / no PC' }, ...s.layout.stations.map(a => ({ value: a.id, label: `${a.name}${s.live[a.id]?.user ? ' · ' + s.live[a.id].user : ''}` }))]} />
          <Combobox label="Member" value={s.cartMember} onChange={v => s.set({ cartMember: v })} options={[{ value: '', label: 'Walk-in' }, ...s.members.map(m => ({ value: m.id, label: m.user, hint: `$${m.wallet.toFixed(0)}` }))]} placeholder="Walk-in" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 min-h-[120px]">
          {!s.cart.length ? <div className="h-full grid place-items-center text-center sub py-10"><div><ShoppingCart size={28} className="mx-auto mb-2 faint" />Cart is empty<div className="text-[11px] faint">Tap a product to add it</div></div></div> :
            <ul className="flex flex-col gap-2">{s.cart.map(c => { const p = s.products.find(x => x.sku === c.sku)!; return (
              <li key={c.sku} className="inset-glass p-2 flex items-center gap-2.5 anim-in"><span className="text-xl w-8 text-center" aria-hidden>{p.emoji}</span><div className="min-w-0 flex-1"><div className="text-[13px] font-semibold truncate">{p.name}</div><div className="text-[11px] faint tnum">{money(p.price)} ea</div></div>
                <div className="flex items-center gap-1"><Button icon size="sm" aria-label={`Decrease ${p.name}`} onClick={() => s.setQty(c.sku, -1)}>{c.qty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}</Button><span className="w-6 text-center tnum font-bold text-sm">{c.qty}</span><Button icon size="sm" aria-label={`Increase ${p.name}`} onClick={() => s.setQty(c.sku, 1)}><Plus size={12} /></Button></div>
                <div className="w-14 text-right tnum font-bold text-[13px]">{money(p.price * c.qty)}</div></li>) })}</ul>}
        </div>
        <div className="p-3.5 border-t border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2"><Percent size={14} className="muted" /><div className="flex gap-1.5 flex-1">{[0, 5, 10, 15, 20].map(d => <Button key={d} size="sm" className="flex-1" on={s.cartDiscount === d} onClick={() => s.set({ cartDiscount: d })}>{d}%</Button>)}</div>{mem && mem.discount > 0 && <Button size="sm" v="ghost" onClick={() => s.set({ cartDiscount: mem.discount })}>{mem.tier} {mem.discount}%</Button>}</div>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Payment method">{pays.map(([k, I]) => <button key={k} role="radio" aria-checked={s.cartPay === k} onClick={() => s.set({ cartPay: k })} className={cn('btn !h-9 !justify-start', s.cartPay === k && 'on')}><I size={14} />{k === 'PC Tab' ? 'Charge to PC Tab' : k}{s.cartPay === k && <Check size={12} className="ml-auto" />}</button>)}</div>
          <div className="text-[13px] flex flex-col gap-1 tnum"><div className="flex justify-between muted"><span>Subtotal</span><span>{money(sub)}</span></div>{s.cartDiscount > 0 && <div className="flex justify-between" style={{ color: 'var(--ok)' }}><span>Discount {s.cartDiscount}%</span><span>−{money(disc)}</span></div>}<div className="flex justify-between muted"><span>Tax {s.settings.tax}%{s.settings.taxIncl ? ' (incl.)' : ''}</span><span>{money(tax)}</span></div>
            <div className="flex justify-between text-xl font-bold pt-1 border-t border-white/10"><span>Total</span><span>{money(total)}</span></div></div>
          <div className="grid grid-cols-2 gap-2"><Button size="lg" onClick={() => s.checkout(true)} disabled={!s.cart.length}><Send size={15} />Send Order</Button><Button size="lg" v="primary" onClick={() => s.checkout(false)} disabled={!s.cart.length}><Check size={15} />Checkout</Button></div>
          <div className="flex justify-between items-center"><span className="text-[10px] faint">Order #{s.orderNo} · demo data, no real payment</span>{s.cart.length > 0 && <Button size="sm" v="ghost" onClick={s.clearCart}>Clear</Button>}</div>
        </div>
      </Glass>
    </div>
  )
}

export default function Cafe() {
  const mode = useStore(s => s.cafeMode), set = useStore(s => s.set), cartN = useStore(s => s.cart.reduce((a, c) => a + c.qty, 0))
  return (
    <div className="h-full flex flex-col p-3 sm:p-4 pb-24 md:pb-4 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={mode} onChange={v => set({ cafeMode: v })} tabs={[{ id: 'pos', label: 'POS & Cart', icon: <ShoppingCart size={15} />, count: cartN || undefined }, { id: 'floor', label: 'Floor Map', icon: <MapIcon size={15} /> }]} />
        <div className="text-xs muted hidden sm:block">{mode === 'pos' ? 'Cart is kept when you switch to the floor and back.' : 'Live operations & layout editor'}</div>
      </div>
      <div className="flex-1 min-h-0">{mode === 'pos' ? <POS /> : <FloorMap />}</div>
      {mode === 'floor' && <BatchBar />}
    </div>
  )
}
export const _u = [User, Monitor, Card, Badge, NumberInput]
