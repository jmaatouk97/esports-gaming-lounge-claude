import { useState } from 'react'
import { Save, RotateCcw, DollarSign, Settings2, Palette } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button, Card, PageHeader, Switch, Tabs, Slider } from '../components/ui/core'
import { Input, NumberInput, Textarea, Select } from '../components/ui/forms'
import { AppearancePanel } from '../components/appearance/Appearance'
import { money } from '../lib/utils'

export default function Settings() {
  const s = useStore(), [tab, setTab] = useState<'pricing' | 'system' | 'look'>('pricing')
  const p = s.pricing, c = s.settings
  const setP = (x: Partial<typeof p>) => s.set({ pricing: { ...p, ...x } }), setC = (x: Partial<typeof c>) => s.set({ settings: { ...c, ...x } })
  const eff = (base: number, pct: number) => money(base * (1 + pct / 100))
  const [err, setErr] = useState('')
  const saved = () => s.toast({ title: 'Settings saved', body: 'Persisted locally in this browser (demo)', level: 'ok' })
  return (
    <div className="page">
      <PageHeader title="Pricing & System Settings" actions={<Tabs value={tab} onChange={setTab} tabs={[{ id: 'pricing', label: 'Pricing', icon: <DollarSign size={14} /> }, { id: 'system', label: 'System', icon: <Settings2 size={14} /> }, { id: 'look', label: 'Appearance', icon: <Palette size={14} /> }]} />} />
      {tab === 'pricing' && <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Hourly rates"><div className="grid grid-cols-3 gap-3"><NumberInput label="Main Hall" prefix="$" step={.5} value={p.main} onChange={v => setP({ main: v })} /><NumberInput label="VIP" prefix="$" step={.5} value={p.vip} onChange={v => setP({ vip: v })} /><NumberInput label="Console" prefix="$" step={.5} value={p.console} onChange={v => setP({ console: v })} /></div>
          <div className="mt-4 text-xs muted">Effective Main Hall rate: peak <b className="tnum">{eff(p.main, p.peak)}</b> · off-peak <b className="tnum">{eff(p.main, p.offpeak)}</b> · happy hour <b className="tnum">{eff(p.main, p.happyHour)}</b></div></Card>
        <Card title="Time-of-day modifiers"><div className="flex flex-col gap-4"><Slider label="Peak pricing (18:00–23:00)" value={p.peak} min={0} max={60} unit="%" onChange={v => setP({ peak: v })} /><Slider label="Off-peak (10:00–14:00)" value={p.offpeak} min={-50} max={0} unit="%" onChange={v => setP({ offpeak: v })} />
          <div className="grid grid-cols-2 gap-3"><NumberInput label="Overnight flat" prefix="$" value={p.overnight} onChange={v => setP({ overnight: v })} /><NumberInput label="Overnight sold as" value={10} suffix="hrs" min={10} max={10} onChange={() => { }} /></div></div></Card>
        <Card title="Happy hour"><div className="grid grid-cols-3 gap-3"><NumberInput label="Discount %" suffix="%" value={Math.abs(p.happyHour)} max={80} onChange={v => setP({ happyHour: -v })} /><NumberInput label="From" value={p.happyStart} max={23} suffix=":00" onChange={v => setP({ happyStart: v })} /><NumberInput label="To" value={p.happyEnd} max={24} suffix=":00" onChange={v => { if (v <= p.happyStart) { setErr('End must be after start'); return } setErr(''); setP({ happyEnd: v }) }} /></div>{err && <p className="text-xs mt-2" style={{ color: 'var(--bad)' }}>{err}</p>}</Card>
        <Card title="Member discounts by tier"><div className="grid grid-cols-2 gap-3">{['Guest', 'Standard', 'VIP', 'Esports Pro'].map((t, i) => <NumberInput key={t} label={t} suffix="%" value={p.memberDisc[i]} max={50} step={5} onChange={v => setP({ memberDisc: p.memberDisc.map((x, k) => k === i ? v : x) })} />)}</div></Card>
        <div className="lg:col-span-2 flex justify-end"><Button v="primary" onClick={saved}><Save size={14} />Save pricing</Button></div></div>}
      {tab === 'system' && <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Client lock-screen branding"><div className="flex flex-col gap-3"><Input label="Venue name" value={c.lockBrand} onChange={e => setC({ lockBrand: e.target.value })} /><Input label="Tagline" value={c.lockTagline} onChange={e => setC({ lockTagline: e.target.value })} />
          <div className="glass-lite !rounded-2xl h-32 grid place-items-center text-center" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}><div><div className="text-xl font-bold text-white drop-shadow">{c.lockBrand || 'Venue'}</div><div className="text-xs text-white/80">{c.lockTagline}</div><div className="mt-2 inline-block rounded-lg bg-black/30 text-white/90 text-[10px] px-2 py-0.5 tnum">PC LOCKED · preview</div></div></div></div></Card>
        <Card title="Automation & tax"><div className="flex flex-col gap-4"><NumberInput label="Idle auto-shutdown" suffix="min" value={c.idleMin} min={0} max={240} step={5} onChange={v => setC({ idleMin: v })} /><div className="grid grid-cols-2 gap-3 items-end"><NumberInput label="Tax rate" suffix="%" value={c.tax} max={40} step={.5} onChange={v => setC({ tax: v })} /><Switch checked={c.taxIncl} onChange={v => setC({ taxIncl: v })} label="Prices include tax" /></div></div></Card>
        <Card title="Receipt" className="lg:col-span-2"><div className="grid gap-3 md:grid-cols-2"><div className="flex flex-col gap-3"><Textarea label="Header" value={c.receiptHeader} onChange={e => setC({ receiptHeader: e.target.value })} /><Input label="Footer" value={c.receiptFooter} onChange={e => setC({ receiptFooter: e.target.value })} /><Switch checked={c.receiptLogo} onChange={v => setC({ receiptLogo: v })} label="Print logo" /></div>
          <pre className="inset-glass p-4 text-[11px] leading-5 tnum whitespace-pre-wrap">{`${c.receiptLogo ? '[ LOGO ]\n' : ''}${c.receiptHeader}\n------------------------\n2× Latte            ${money(7)}\n1× Gamer Burger     ${money(8.5)}\n------------------------\nTax ${c.tax}%${c.taxIncl ? ' (incl.)' : ''}         ${money(15.5 * c.tax / 100)}\nTOTAL            ${money(15.5 * (c.taxIncl ? 1 : 1 + c.tax / 100))}\n\n${c.receiptFooter}`}</pre></div></Card>
        <Card title="Default theme" className="lg:col-span-2"><div className="flex items-center gap-3 flex-wrap"><Select value={s.appearance.theme} onChange={v => s.setAppearance({ theme: v as 'dark' | 'light' })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} className="w-40" /><span className="sub">Typography, color presets and glass optics live in the Appearance tab.</span></div></Card>
        <div className="lg:col-span-2 flex justify-end gap-2"><Button onClick={() => s.confirm('Reset demo data?', 'Clears all locally saved changes (layout, stock, members, settings) and reloads.', 'Reset everything', () => { localStorage.removeItem('esl-claude-v1'); location.reload() })}><RotateCcw size={14} />Reset demo data</Button><Button v="primary" onClick={saved}><Save size={14} />Save settings</Button></div></div>}
      {tab === 'look' && <div className="max-w-3xl"><div className="glass"><AppearancePanel /></div></div>}
    </div>
  )
}
