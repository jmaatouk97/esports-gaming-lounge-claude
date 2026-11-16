import { useMemo } from 'react'
import { DollarSign, Monitor, MonitorCheck, Coffee, Timer, Gauge, LogIn, ShoppingBag, Play, AlertTriangle, UserCog, CreditCard } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { useStore } from '../store/useStore'
import { Card, Circular, PageHeader, Badge } from '../components/ui/core'
import { Kpi } from '../components/ui/data'
import { money0 } from '../lib/utils'
import { mulberry } from '../lib/utils'

export const chartTip = { contentStyle: { background: 'rgba(16,19,40,.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, fontSize: 12, color: '#eef1ff', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }, itemStyle: { color: '#eef1ff' }, labelStyle: { color: '#a9b2d6', fontWeight: 700 }, cursor: { fill: 'rgba(255,255,255,.06)' } }
const hours = Array.from({ length: 14 }, (_, i) => i + 10)
export function useHourly() {
  return useMemo(() => { const r = mulberry(7); return hours.map(h => { const f = Math.exp(-Math.pow((h - 20) / 4.5, 2)) * .85 + .15; return { h: `${h}:00`, pc: Math.round(60 + f * 260 + r() * 30), cafe: Math.round(20 + f * 90 + r() * 15) } }) }, [])
}
const ICONS = { checkin: LogIn, order: ShoppingBag, session: Play, alert: AlertTriangle, staff: UserCog, payment: CreditCard }
const TONES = { checkin: 'var(--ok)', order: 'var(--accent2)', session: 'var(--info)', alert: 'var(--bad)', staff: 'var(--warn)', payment: 'var(--ok)' }

export default function Overview() {
  const live = useStore(s => s.live), rev = useStore(s => s.revenue), activity = useStore(s => s.activity), total = useStore(s => s.layout.stations.length)
  const hourly = useHourly()
  const L = Object.values(live), active = L.filter(l => l.status === 'in-use').length, avail = L.filter(l => l.status === 'available').length
  const occ = Math.round((active / Math.max(1, total)) * 100)
  const avgSess = Math.round(L.filter(l => l.startedAt).reduce((a, l) => a + (Date.now() - l.startedAt!) / 60000, 0) / Math.max(1, active))
  const gross = rev.pc + rev.cafe
  const heat = useMemo(() => { const r = mulberry(21); return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, di) => ({ d, v: hours.map(h => Math.round(Math.min(100, (Math.exp(-Math.pow((h - 20) / 4, 2)) * 70 + (di > 3 ? 25 : 0) + r() * 18)))) })) }, [])
  const pie = [{ n: 'PC time', v: rev.pc }, { n: 'Cafe & POS', v: rev.cafe }, { n: 'Packages', v: 410 }, { n: 'Tournaments', v: 180 }]
  const pc = ['var(--accent)', 'var(--accent2)', '#34d399', '#f59e0b']
  const spark = (b: number) => Array.from({ length: 12 }, (_, i) => b + Math.sin(i / 1.6) * b * .15 + i * b * .02)
  return (
    <div className="page">
      <PageHeader title="Overview" sub={`${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} · live demo data`} actions={<Badge tone="info" dot>Simulated telemetry</Badge>} />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 stagger">
        <Kpi label="Total revenue" value={money0(gross)} delta={12.4} icon={<DollarSign size={16} />} spark={spark(40)} sub="vs yesterday" />
        <Kpi label="Active stations" value={`${active}/${total}`} delta={6.1} icon={<Monitor size={16} />} spark={spark(30)} tone="var(--info)" sub="in session" />
        <Kpi label="Available" value={avail} delta={-3.2} icon={<MonitorCheck size={16} />} spark={spark(12)} tone="var(--ok)" sub="ready to play" />
        <Kpi label="Cafe orders" value={rev.orders} delta={8.9} icon={<Coffee size={16} />} spark={spark(20)} tone="var(--accent2)" sub={money0(rev.cafe)} />
        <Kpi label="Avg session" value={`${avgSess}m`} delta={2.3} icon={<Timer size={16} />} spark={spark(50)} sub="running now" />
        <Kpi label="Occupancy" value={`${occ}%`} delta={4.7} icon={<Gauge size={16} />} spark={spark(60)} tone="var(--warn)" sub="current floor" />
      </div>
      <div className="grid gap-3 mt-3 lg:grid-cols-3">
        <Card title="Hourly revenue" className="lg:col-span-2" right={<Badge>today</Badge>}>
          <div className="h-64"><ResponsiveContainer><AreaChart data={hourly} margin={{ left: -14, right: 6, top: 8 }}>
            <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: .6 }} /><stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} /></linearGradient><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--accent2)', stopOpacity: .55 }} /><stop offset="100%" style={{ stopColor: 'var(--accent2)', stopOpacity: 0 }} /></linearGradient></defs>
            <CartesianGrid vertical={false} /><XAxis dataKey="h" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={v => '$' + v} /><Tooltip {...chartTip} formatter={(v: number) => '$' + v} />
            <Area type="monotone" dataKey="pc" name="PC time" stroke="var(--accent)" strokeWidth={2} fill="url(#gp)" /><Area type="monotone" dataKey="cafe" name="Cafe POS" stroke="var(--accent2)" strokeWidth={2} fill="url(#gc)" /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card title="Floor occupancy">
          <div className="flex flex-col items-center gap-3 py-2"><Circular value={occ} size={150} stroke={14}><div className="text-center"><div className="text-3xl font-bold tnum">{occ}%</div><div className="text-[10px] faint font-bold tracking-widest">OCCUPIED</div></div></Circular>
            <div className="grid grid-cols-3 gap-2 w-full text-center text-xs">{[['In use', active, 'var(--info)'], ['Ready', avail, 'var(--ok)'], ['Other', total - active - avail, 'var(--warn)']].map(([k, v, c]) => <div key={k as string} className="inset-glass p-2"><div className="text-lg font-bold tnum" style={{ color: c as string }}>{v}</div><div className="faint">{k}</div></div>)}</div></div>
        </Card>
        <Card title="PC time vs Cafe POS" className="lg:col-span-1"><div className="h-52"><ResponsiveContainer><BarChart data={hourly.filter((_, i) => i % 2 === 0)} margin={{ left: -14, right: 4 }}><CartesianGrid vertical={false} /><XAxis dataKey="h" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip {...chartTip} /><Bar dataKey="pc" name="PC time" fill="var(--accent)" radius={[5, 5, 0, 0]} /><Bar dataKey="cafe" name="Cafe POS" fill="var(--accent2)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Revenue breakdown"><div className="h-52"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="v" nameKey="n" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="none">{pie.map((_, i) => <Cell key={i} fill={pc[i]} />)}</Pie><Tooltip {...chartTip} formatter={(v: number) => money0(v)} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
        <Card title="Live activity" pad={false} className="row-span-2"><ul className="max-h-[380px] overflow-y-auto px-4 pb-4 pt-1 flex flex-col gap-2.5">{activity.map(a => { const I = ICONS[a.kind]; return <li key={a.id} className="flex gap-2.5 items-start anim-in"><span className="w-7 h-7 rounded-lg grid place-items-center shrink-0 inset-glass" style={{ color: TONES[a.kind] }}><I size={14} /></span><div className="min-w-0"><div className="text-[12.5px] leading-snug">{a.text}</div><div className="text-[10px] faint tnum">{new Date(a.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></li> })}</ul></Card>
        <Card title="Peak hours heatmap" className="lg:col-span-2">
          <div className="overflow-x-auto"><div style={{ minWidth: 520 }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: `38px repeat(${hours.length}, 1fr)` }}><div />{hours.map(h => <div key={h} className="text-[9px] faint text-center tnum">{h}</div>)}
              {heat.map(r => <div key={r.d} className="contents"><div className="text-[11px] muted self-center font-semibold">{r.d}</div>{r.v.map((v, i) => <div key={i} title={`${r.d} ${hours[i]}:00 — ${v}%`} className="h-6 rounded-md" style={{ background: `color-mix(in srgb, var(--accent) ${v}%, rgba(var(--gc),.06))` }} />)}</div>)}</div>
          </div></div>
        </Card>
      </div>
    </div>
  )
}
