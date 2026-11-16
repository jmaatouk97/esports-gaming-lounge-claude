import { useState } from 'react'
import { Wallet, Timer, KeyRound, Percent, History, ShoppingBag, MoreHorizontal, UserPlus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Avatar, Badge, Button, PageHeader, tierTone } from '../components/ui/core'
import { DataTable, type Col } from '../components/ui/data'
import { Dropdown, Modal } from '../components/ui/overlays'
import { Input, NumberInput, Select } from '../components/ui/forms'
import { money } from '../lib/utils'
import type { Member, Tier } from '../store/types'

const PACKS = [{ id: '1h', label: '1 Hour', hours: 1, price: 4 }, { id: '3h', label: '3 Hours', hours: 3, price: 10 }, { id: '5h', label: '5 Hours', hours: 5, price: 15 }, { id: 'night', label: 'All-Night Pass', hours: 10, price: 25 }]
type Act = null | { m: Member; kind: 'topup' | 'pack' | 'pin' | 'disc' | 'sessions' | 'orders' | 'new' }

export default function Members() {
  const s = useStore(), [act, setAct] = useState<Act>(null), [amt, setAmt] = useState(20), [pack, setPack] = useState('3h'), [disc, setDisc] = useState(10), [pin, setPin] = useState(''), [tier, setTier] = useState<Tier | 'all'>('all')
  const [nu, setNu] = useState({ user: '', name: '', tier: 'Standard' as Tier }), [nerr, setNerr] = useState('')
  const upd = (id: string, p: Partial<Member>) => s.set({ members: s.members.map(m => m.id === id ? { ...m, ...p } : m) })
  const rows = s.members.filter(m => tier === 'all' || m.tier === tier)
  const cols: Col<Member>[] = [
    { key: 'user', label: 'Member', render: m => <span className="flex items-center gap-2.5"><Avatar name={m.user} size={30} /><span><b>{m.user}</b><span className="block text-[11px] faint">{m.name}</span></span></span> },
    { key: 'tier', label: 'Tier', render: m => <Badge tone={tierTone(m.tier)}>{m.tier}</Badge> },
    { key: 'hours', label: 'Hours left', render: m => <span className="tnum font-semibold">{m.hours.toFixed(1)}h</span>, sort: (a, b) => a.hours - b.hours },
    { key: 'wallet', label: 'Wallet', render: m => <span className="tnum font-semibold">{money(m.wallet)}</span>, sort: (a, b) => a.wallet - b.wallet },
    { key: 'lastPc', label: 'Last PC', render: m => <span className="tnum">{m.lastPc}</span> },
    { key: 'status', label: 'Status', render: m => <Badge tone={m.status === 'active' ? 'ok' : m.status === 'new' ? 'info' : 'bad'} dot>{m.status}</Badge> },
    { key: 'a', label: '', render: m => <span className="flex gap-1"><Button size="sm" onClick={() => setAct({ m, kind: 'topup' })}><Wallet size={13} />Top up</Button>
      <Dropdown align="end" trigger={<Button size="sm" icon v="ghost" aria-label={`Actions for ${m.user}`}><MoreHorizontal size={15} /></Button>} items={[
        { label: 'Sell time package', icon: <Timer size={14} />, onClick: () => setAct({ m, kind: 'pack' }) }, { label: 'Reset client PIN', icon: <KeyRound size={14} />, onClick: () => { setPin(String(Math.floor(1000 + Math.random() * 9000))); setAct({ m, kind: 'pin' }) } },
        { label: 'Assign VIP discount', icon: <Percent size={14} />, onClick: () => { setDisc(m.discount || 10); setAct({ m, kind: 'disc' }) } }, { sep: true },
        { label: 'View session history', icon: <History size={14} />, onClick: () => setAct({ m, kind: 'sessions' }) }, { label: 'View order history', icon: <ShoppingBag size={14} />, onClick: () => setAct({ m, kind: 'orders' }) }, { sep: true },
        { label: m.status === 'suspended' ? 'Reactivate account' : 'Suspend account', danger: m.status !== 'suspended', onClick: () => upd(m.id, { status: m.status === 'suspended' ? 'active' : 'suspended' }) }]} /></span> },
  ]
  const hist = (m: Member) => Array.from({ length: 5 }, (_, i) => ({ d: new Date(Date.now() - i * 86400000 * 1.4).toLocaleDateString('en', { month: 'short', day: 'numeric' }), pc: `PC-${String(((parseInt(m.id.slice(1)) * 3 + i * 7) % 56) + 1).padStart(2, '0')}`, dur: `${1 + ((i * 2 + 1) % 4)}h ${(i * 15) % 60}m`, cost: money(3 + i * 2.5) }))
  return (
    <div className="page">
      <PageHeader title="Members & Client Logins" sub={`${s.members.length} accounts`} actions={<Button v="primary" onClick={() => { setNerr(''); setNu({ user: '', name: '', tier: 'Standard' }); setAct({ m: s.members[0], kind: 'new' }) }}><UserPlus size={14} />New member</Button>} />
      <div className="flex gap-2 mb-3 flex-wrap">{(['all', 'Guest', 'Standard', 'VIP', 'Esports Pro'] as const).map(t => <Button key={t} size="sm" on={tier === t} onClick={() => setTier(t)}>{t === 'all' ? 'All tiers' : t} <span className="faint tnum">{t === 'all' ? s.members.length : s.members.filter(m => m.tier === t).length}</span></Button>)}</div>
      <DataTable rows={rows} cols={cols} rowKey={m => m.id} search searchKeys={['user', 'name', 'tier', 'lastPc']} />
      <Modal open={act?.kind === 'topup'} onClose={() => setAct(null)} size="sm" title={`Top up · ${act?.m.user}`} footer={<><Button onClick={() => setAct(null)}>Cancel</Button><Button v="primary" onClick={() => { s.topUp(act!.m.id, amt); setAct(null) }}>Add {money(amt)}</Button></>}>
        <div className="flex gap-1.5 flex-wrap mb-3">{[5, 10, 20, 50, 100].map(v => <Button key={v} size="sm" on={amt === v} onClick={() => setAmt(v)}>${v}</Button>)}</div><NumberInput label="Amount" prefix="$" value={amt} min={1} max={1000} onChange={setAmt} /></Modal>
      <Modal open={act?.kind === 'pack'} onClose={() => setAct(null)} title={`Sell time package · ${act?.m.user}`} footer={<><Button onClick={() => setAct(null)}>Cancel</Button><Button v="primary" onClick={() => { const p = PACKS.find(x => x.id === pack)!; if (act!.m.wallet < p.price) { s.toast({ title: 'Insufficient wallet', body: `Needs ${money(p.price)}`, level: 'bad' }); return } upd(act!.m.id, { hours: act!.m.hours + p.hours, wallet: +(act!.m.wallet - p.price).toFixed(2) }); s.logActivity('payment', `${p.label} sold to ${act!.m.user} · ${money(p.price)}`); s.toast({ title: `${p.label} added`, level: 'ok' }); setAct(null) }}>Sell</Button></>}>
        <div className="grid grid-cols-2 gap-2">{PACKS.map(p => <button key={p.id} onClick={() => setPack(p.id)} aria-pressed={pack === p.id} className={`inset-glass p-3 text-left focus-ring ${pack === p.id ? '!border-[var(--accent)]' : ''}`}><div className="font-bold">{p.label}</div><div className="tnum text-sm" style={{ color: 'var(--accent)' }}>{money(p.price)}</div></button>)}</div><p className="sub mt-3">Charged to wallet ({act ? money(act.m.wallet) : ''}).</p></Modal>
      <Modal open={act?.kind === 'pin'} onClose={() => setAct(null)} size="sm" title="Reset client PIN" footer={<><Button onClick={() => setAct(null)}>Cancel</Button><Button v="primary" onClick={() => { s.toast({ title: `PIN reset for ${act!.m.user}`, body: 'Demo only — nothing was sent', level: 'ok', simulated: true }); setAct(null) }}>Confirm reset</Button></>}>
        <p className="sub mb-2">New temporary PIN (shown once):</p><div className="timer text-4xl text-center py-4 inset-glass tracking-[.4em]">{pin}</div></Modal>
      <Modal open={act?.kind === 'disc'} onClose={() => setAct(null)} size="sm" title={`VIP discount · ${act?.m.user}`} footer={<><Button onClick={() => setAct(null)}>Cancel</Button><Button v="primary" onClick={() => { upd(act!.m.id, { discount: disc }); s.toast({ title: `${disc}% discount assigned`, level: 'ok' }); setAct(null) }}>Assign</Button></>}><NumberInput label="Discount %" suffix="%" value={disc} max={50} step={5} onChange={setDisc} /></Modal>
      <Modal open={act?.kind === 'sessions' || act?.kind === 'orders'} onClose={() => setAct(null)} title={`${act?.kind === 'orders' ? 'Order' : 'Session'} history · ${act?.m.user}`}>
        <table className="gt"><thead><tr><th>Date</th><th>{act?.kind === 'orders' ? 'Items' : 'PC'}</th><th>{act?.kind === 'orders' ? 'Via' : 'Duration'}</th><th>{act?.kind === 'orders' ? 'Total' : 'Cost'}</th></tr></thead><tbody>{act && hist(act.m).map((h, i) => <tr key={i}><td className="tnum">{h.d}</td><td>{act.kind === 'orders' ? ['Latte + Chips', 'Burger', 'Energy Drink', 'Ramen', 'Pizza ×2'][i] : h.pc}</td><td className="tnum">{act.kind === 'orders' ? h.pc : h.dur}</td><td className="tnum">{h.cost}</td></tr>)}</tbody></table></Modal>
      <Modal open={act?.kind === 'new'} onClose={() => setAct(null)} title="New member" footer={<><Button onClick={() => setAct(null)}>Cancel</Button><Button v="primary" onClick={() => { if (nu.user.trim().length < 3) { setNerr('Username needs 3+ characters'); return } if (s.members.some(m => m.user.toLowerCase() === nu.user.toLowerCase())) { setNerr('Username is taken'); return } s.set({ members: [{ id: 'm' + Date.now(), user: nu.user.trim(), name: nu.name || '—', tier: nu.tier, hours: 0, wallet: 0, lastPc: '—', status: 'new', discount: 0, pin: '••••' }, ...s.members] }); s.toast({ title: 'Member created', body: nu.user, level: 'ok' }); setAct(null) }}>Create</Button></>}>
        <div className="flex flex-col gap-3"><Input label="Username" value={nu.user} error={nerr} onChange={e => { setNu({ ...nu, user: e.target.value }); setNerr('') }} /><Input label="Full name" value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} /><Select label="Tier" value={nu.tier} onChange={v => setNu({ ...nu, tier: v as Tier })} options={['Guest', 'Standard', 'VIP', 'Esports Pro'].map(v => ({ value: v, label: v }))} /></div></Modal>
    </div>
  )
}
