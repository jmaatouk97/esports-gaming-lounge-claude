import { useMemo, useState } from 'react'
import { DollarSign, TrendingUp, Monitor, Coffee, ReceiptText, FileText, Lock } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { useStore } from '../store/useStore'
import { Button, Card, PageHeader, Badge, Glass } from '../components/ui/core'
import { Kpi, DataTable, type Col } from '../components/ui/data'
import { DateRangePicker, iso, NumberInput } from '../components/ui/forms'
import { Modal } from '../components/ui/overlays'
import { chartTip } from './Overview'
import { money, money0, mulberry } from '../lib/utils'
import type { Debt } from '../store/types'

export default function Finance() {
  const s = useStore()
  const end = new Date(), start = new Date(); start.setDate(end.getDate() - 13)
  const [range, setRange] = useState<[string | null, string | null]>([iso(start), iso(end)])
  const [z, setZ] = useState(false), [close, setClose] = useState(false), [counted, setCounted] = useState(0)
  const days = useMemo(() => {
    const r = mulberry(5), a = range[0] ? new Date(range[0]) : start, b = range[1] ? new Date(range[1]) : a, out = []
    for (let d = new Date(a); d <= b && out.length < 62; d.setDate(d.getDate() + 1)) { const w = d.getDay() >= 5 ? 1.35 : 1; const pc = Math.round((1300 + r() * 600) * w), cafe = Math.round((380 + r() * 260) * w), exp = Math.round(500 + r() * 260); out.push({ d: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), pc, cafe, exp }) }
    return out
  }, [range]) // eslint-disable-line
  const pcT = days.reduce((a, d) => a + d.pc, 0), cafeT = days.reduce((a, d) => a + d.cafe, 0), expT = days.reduce((a, d) => a + d.exp, 0), gross = pcT + cafeT
  const sh = s.shift, expected = sh.float + sh.cash
  const debtCols: Col<Debt>[] = [
    { key: 'kind', label: 'Type', render: d => <Badge tone={d.kind === 'Supplier Invoice' ? 'warn' : d.kind === 'Staff Advance' ? 'info' : 'acc'}>{d.kind}</Badge> }, { key: 'who', label: 'Party', render: d => <b>{d.who}</b> },
    { key: 'amount', label: 'Amount', render: d => <span className="tnum font-semibold">{money(d.amount)}</span>, sort: (a, b) => a.amount - b.amount }, { key: 'due', label: 'Due', render: d => <span className="tnum" style={{ color: !d.settled && d.due < iso(new Date()) ? 'var(--bad)' : undefined }}>{d.due}</span> },
    { key: 'st', label: '', render: d => d.settled ? <Badge tone="ok">Settled</Badge> : <Button size="sm" v="primary" onClick={() => { s.set({ debts: s.debts.map(x => x.id === d.id ? { ...x, settled: true } : x) }); s.toast({ title: `Settled ${money(d.amount)}`, body: d.who, level: 'ok' }) }}>Settle</Button> },
  ]
  return (
    <div className="page">
      <PageHeader title="Finance & Reports" sub="Demo figures — no real payment processor attached" actions={<div className="w-64"><DateRangePicker value={range} onChange={setRange} /></div>} />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 stagger">
        <Kpi label="Gross revenue" value={money0(gross)} delta={9.2} icon={<DollarSign size={16} />} />
        <Kpi label="Net profit" value={money0(gross - expT)} delta={14.1} icon={<TrendingUp size={16} />} tone="var(--ok)" />
        <Kpi label="PC time" value={money0(pcT)} delta={6.4} icon={<Monitor size={16} />} tone="var(--info)" />
        <Kpi label="Cafe" value={money0(cafeT)} delta={11.8} icon={<Coffee size={16} />} tone="var(--accent2)" />
        <Kpi label="Expenses" value={money0(expT)} delta={-2.1} icon={<ReceiptText size={16} />} tone="var(--warn)" />
      </div>
      <div className="grid gap-3 mt-3 lg:grid-cols-2">
        <Card title="Revenue by day"><div className="h-60"><ResponsiveContainer><BarChart data={days} margin={{ left: -10 }}><CartesianGrid vertical={false} /><XAxis dataKey="d" tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis tickLine={false} axisLine={false} /><Tooltip {...chartTip} formatter={(v: number) => money0(v)} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="pc" name="PC time" stackId="a" fill="var(--accent)" /><Bar dataKey="cafe" name="Cafe" stackId="a" fill="var(--accent2)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Revenue vs expenses"><div className="h-60"><ResponsiveContainer><AreaChart data={days} margin={{ left: -10 }}><CartesianGrid vertical={false} /><XAxis dataKey="d" tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis tickLine={false} axisLine={false} /><Tooltip {...chartTip} formatter={(v: number) => money0(v)} /><Area dataKey="exp" name="Expenses" stroke="var(--bad)" fill="var(--bad)" fillOpacity={.15} strokeWidth={2} /><Area dataKey={(d: { pc: number; cafe: number }) => d.pc + d.cafe} name="Revenue" stroke="var(--ok)" fill="var(--ok)" fillOpacity={.15} strokeWidth={2} /></AreaChart></ResponsiveContainer></div></Card>
      </div>
      <div className="grid gap-3 mt-3 lg:grid-cols-[360px_1fr]">
        <Card title="Shift management" right={<Badge tone={sh.open ? 'ok' : 'bad'} dot>{sh.open ? 'Active shift' : 'Closed'}</Badge>}>
          <div className="text-xs muted mb-2">{sh.employee} · since {new Date(sh.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="flex flex-col gap-1.5 tnum text-[13px]">{[['Opening float', sh.float], ['Cash sales', sh.cash], ['Card sales', sh.card], ['Member top-ups', sh.topups]].map(([k, v]) => <div key={k as string} className="flex justify-between inset-glass px-3 py-2"><span className="muted">{k}</span><span className="font-semibold">{money(v as number)}</span></div>)}
            <div className="flex justify-between px-3 py-2.5 rounded-xl glass-tint font-bold text-base"><span>Expected drawer</span><span>{money(expected)}</span></div></div>
          <div className="grid grid-cols-2 gap-2 mt-3"><Button onClick={() => setZ(true)}><FileText size={14} />Z-Report</Button><Button v="danger" disabled={!sh.open} onClick={() => { setCounted(Math.round(expected)); setClose(true) }}><Lock size={14} />Close shift</Button></div>
          {!sh.open && <Button className="w-full mt-2" v="primary" onClick={() => s.set({ shift: { ...sh, open: true, startedAt: Date.now(), cash: 0, card: 0, topups: 0 } })}>Open new shift</Button>}
        </Card>
        <div><div className="text-[13px] font-semibold mb-2 px-1">Debt management</div><DataTable rows={s.debts} cols={debtCols} rowKey={d => d.id} search searchKeys={['who', 'kind']} /></div>
      </div>
      <Modal open={z} onClose={() => setZ(false)} title="Z-Report" size="sm" footer={<><Button onClick={() => setZ(false)}>Close</Button><Button v="primary" onClick={() => { window.print() }}>Print</Button></>}>
        <pre className="tnum text-xs leading-6 whitespace-pre-wrap">{`${s.settings.receiptHeader}\n--------------------------\nZ-REPORT  ${new Date().toLocaleString()}\nCashier:  ${sh.employee}\n--------------------------\nOpening float   ${money(sh.float).padStart(12)}\nCash sales      ${money(sh.cash).padStart(12)}\nCard sales      ${money(sh.card).padStart(12)}\nMember top-ups  ${money(sh.topups).padStart(12)}\n--------------------------\nExpected drawer ${money(expected).padStart(12)}\nOrders today    ${String(s.revenue.orders).padStart(12)}\n\n${s.settings.receiptFooter}\n(demo document)`}</pre></Modal>
      <Modal open={close} onClose={() => setClose(false)} size="sm" title="Close shift" footer={<><Button onClick={() => setClose(false)}>Cancel</Button><Button v="danger" onClick={() => { s.set({ shift: { ...sh, open: false, closed: [...sh.closed, { at: Date.now(), counted }] } }); setClose(false); const diff = counted - expected; s.toast({ title: 'Shift closed', body: diff === 0 ? 'Drawer balanced' : `Variance ${money(diff)}`, level: diff === 0 ? 'ok' : 'warn' }) }}>Close shift</Button></>}>
        <p className="sub mb-3">Count the cash drawer. Expected: <b className="tnum">{money(expected)}</b></p><NumberInput label="Counted cash" prefix="$" value={counted} max={100000} onChange={setCounted} />
        <p className="text-xs mt-2 tnum" style={{ color: counted === Math.round(expected) ? 'var(--ok)' : 'var(--warn)' }}>Variance {money(counted - expected)}</p></Modal>
    </div>
  )
}
export const _g = Glass
