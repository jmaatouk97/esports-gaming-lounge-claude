import { useEffect, useMemo, useState } from 'react'
import { Activity, Cpu, Stethoscope, Image as ImageIcon, LayoutGrid, Pause, Play, CheckCheck, AlertTriangle, ListChecks } from 'lucide-react'
import { useStore, statusColor, statusLabel, type Density } from '../store/useStore'
import { Button, Tabs, Badge, PageHeader, Card, Switch, EmptyState } from '../components/ui/core'
import { Select, SearchInput } from '../components/ui/forms'
import { Popover, MenuList } from '../components/ui/overlays'
import { DataTable, type Col } from '../components/ui/data'
import { PcCard, rangeCtx } from '../components/monitoring/PcCard'
import { BatchBar } from '../components/floor/Overlays'
import { openDrawer, runCmd } from '../components/floor/actions'
import type { Status } from '../store/types'

export default function Monitoring() {
  const s = useStore()
  const [tab, setTab] = useState<'rt' | 'hw' | 'diag'>('rt')
  const [zone, setZone] = useState('all'), [status, setStatus] = useState('all'), [q, setQ] = useState(''), [frame, setFrame] = useState(0)
  useEffect(() => { if (!s.thumbMode || s.thumbPaused) return; const t = setInterval(() => setFrame(f => f + 1), s.thumbInterval * 1000); return () => clearInterval(t) }, [s.thumbMode, s.thumbPaused, s.thumbInterval])
  const list = useMemo(() => s.layout.stations.filter(a => (zone === 'all' || a.zone === zone) && (status === 'all' || s.live[a.id]?.status === status) && (a.name + ' ' + (s.live[a.id]?.user ?? '')).toLowerCase().includes(q.toLowerCase())), [s.layout.stations, s.live, zone, status, q])
  rangeCtx.order = list.map(a => a.id)
  const open = s.issues.filter(i => !i.resolved)
  const dens: Density = s.density
  const gridCols = s.thumbMode ? 'repeat(auto-fill,minmax(190px,1fr))' : dens === 'compact' ? 'repeat(auto-fill,minmax(168px,1fr))' : dens === 'standard' ? 'repeat(auto-fill,minmax(220px,1fr))' : 'repeat(auto-fill,minmax(270px,1fr))'
  const alerts = s.layout.stations.filter(a => { const l = s.live[a.id]; return l && (l.cpuT > 88 || l.gpuT > 88 || l.ping > 60) || open.some(i => i.stationId === a.id) }).map(a => a.id)
  const quick: [string, () => string[]][] = [['All', () => list.map(a => a.id)], ['Connected', () => list.filter(a => s.live[a.id].status !== 'offline').map(a => a.id)], ['With alerts', () => alerts], ['In use', () => list.filter(a => s.live[a.id].status === 'in-use').map(a => a.id)], ['Vacant', () => list.filter(a => s.live[a.id].status === 'available').map(a => a.id)]]

  const hwCols: Col<(typeof s.layout.stations)[number]>[] = [
    { key: 'name', label: 'Station', render: r => <button className="font-semibold hover:underline" onClick={() => openDrawer(r.id, 'hardware')}>{r.name}</button> },
    { key: 'cpu', label: 'CPU', render: r => s.specs[r.id]?.cpu }, { key: 'gpu', label: 'GPU', render: r => s.specs[r.id]?.gpu }, { key: 'ram', label: 'RAM', render: r => s.specs[r.id]?.ram },
    { key: 'board', label: 'Motherboard', render: r => s.specs[r.id]?.board }, { key: 'storage', label: 'Storage', render: r => s.specs[r.id]?.storage }, { key: 'monitor', label: 'Monitor', render: r => s.specs[r.id]?.monitor },
    { key: 'hz', label: 'Hz', render: r => <span className="tnum">{s.specs[r.id]?.hz}</span>, sort: (a, b) => s.specs[a.id].hz - s.specs[b.id].hz },
    { key: 'serial', label: 'Peripherals', render: r => <span className="tnum faint">{s.specs[r.id]?.serial}</span> }, { key: 'os', label: 'OS build', render: r => <span className="tnum">{s.specs[r.id]?.os.replace('Windows 11 Pro ', '')}</span> },
    { key: 'games', label: 'Game patches', render: r => { const g = s.specs[r.id]?.games ?? [], bad = g.filter(x => x.patch !== 'current').length; return bad ? <Badge tone="warn">{bad} outdated</Badge> : <Badge tone="ok">{g.length} current</Badge> } },
  ]
  const sevTone = { critical: 'bad', high: 'warn', medium: 'info', low: undefined } as const
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  return (
    <div className="page">
      <PageHeader title="PC Monitoring" sub={`${list.length} of ${s.layout.stations.length} stations · telemetry is simulated until the Windows agent is connected`} actions={<Tabs value={tab} onChange={setTab} tabs={[{ id: 'rt', label: 'Real-time', icon: <Activity size={14} /> }, { id: 'hw', label: 'Hardware & Software', icon: <Cpu size={14} /> }, { id: 'diag', label: 'Health', icon: <Stethoscope size={14} />, count: open.length }]} />} />
      {tab === 'rt' && <>
        <div className="glass p-2.5 flex flex-wrap items-center gap-2 mb-3 !rounded-2xl">
          <SearchInput className="w-44" value={q} onChange={setQ} placeholder="Find PC or user" />
          <div className="w-40"><Select value={zone} onChange={setZone} options={[{ value: 'all', label: 'All zones' }, ...s.layout.zones.map(z => ({ value: z.id, label: z.name }))]} /></div>
          <div className="w-36"><Select value={status} onChange={setStatus} options={[{ value: 'all', label: 'All status' }, ...(['available', 'in-use', 'locked', 'reserved', 'offline', 'maintenance'] as Status[]).map(v => ({ value: v, label: statusLabel[v] }))]} /></div>
          <Popover trigger={<Button><ListChecks size={14} />Select{s.selection.length ? ` (${s.selection.length})` : ''}</Button>}>{close => <MenuList onDone={close} items={[...quick.map(([l, f]) => ({ label: `Select ${l}`, onClick: () => s.select(f()) })), { sep: true as const }, ...s.layout.zones.map(z => ({ label: `Zone: ${z.name}`, onClick: () => s.select(list.filter(a => a.zone === z.id).map(a => a.id)) })), { sep: true as const }, { label: 'Clear selection', onClick: s.clearSel }]} />}</Popover>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Tabs size="sm" value={dens} onChange={v => s.set({ density: v })} tabs={[{ id: 'compact', label: 'Compact' }, { id: 'standard', label: 'Standard' }, { id: 'detailed', label: 'Detailed' }]} />
            <Tabs size="sm" value={s.thumbMode ? 'thumb' : 'tele'} onChange={v => s.set({ thumbMode: v === 'thumb' })} tabs={[{ id: 'tele', label: 'Telemetry', icon: <LayoutGrid size={13} /> }, { id: 'thumb', label: 'Live thumbnails', icon: <ImageIcon size={13} /> }]} />
          </div>
        </div>
        {s.thumbMode && <div className="glass-lite !rounded-xl p-2.5 mb-3 flex flex-wrap items-center gap-3 text-xs"><Badge tone="info">Mock screenshots</Badge><span className="muted">Real captures require the Windows client agent. Frames refresh every</span>
          <div className="w-28"><Select value={String(s.thumbInterval)} onChange={v => s.set({ thumbInterval: +v })} options={[2, 5, 10, 30].map(v => ({ value: String(v), label: `${v} sec` }))} /></div>
          <Button size="sm" onClick={() => s.set({ thumbPaused: !s.thumbPaused })}>{s.thumbPaused ? <><Play size={13} />Resume</> : <><Pause size={13} />Pause</>}</Button></div>}
        {list.length ? <div className="grid gap-2.5" style={{ gridTemplateColumns: gridCols }}>{list.map(a => <PcCard key={a.id} id={a.id} name={a.name} density={dens} thumb={s.thumbMode} frame={frame} />)}</div> : <EmptyState title="No stations match" body="Try clearing the search or filters." />}
        <BatchBar />
      </>}
      {tab === 'hw' && <DataTable rows={list.length ? list : s.layout.stations} cols={hwCols} rowKey={r => r.id} search searchKeys={['name']} maxH="68vh" toolbar={<Badge tone="info">Spec data is mock inventory</Badge>} />}
      {tab === 'diag' && (
        <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
          <Card title={`Attention queue · ${open.length} open`} pad={false}>
            <ul className="divide-y divide-white/10">
              {[...s.issues].sort((a, b) => Number(a.resolved) - Number(b.resolved) || order[a.sev] - order[b.sev]).map(i => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3" style={{ opacity: i.resolved ? .45 : 1 }}>
                  <AlertTriangle size={17} style={{ color: i.sev === 'critical' ? 'var(--bad)' : i.sev === 'high' ? 'var(--warn)' : 'var(--info)' }} />
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold flex items-center gap-2 flex-wrap">{i.kind}<Badge tone={sevTone[i.sev]}>{i.sev}</Badge><button className="text-xs underline faint" onClick={() => openDrawer(i.stationId)}>{s.layout.stations.find(a => a.id === i.stationId)?.name}</button></div><div className="text-xs muted">{i.detail} · {Math.round((Date.now() - i.at) / 60000)} min ago</div></div>
                  {!i.resolved ? <div className="flex gap-1.5"><Button size="sm" onClick={() => runCmd('restart', [i.stationId])}>Restart</Button><Button size="sm" v="primary" onClick={() => { s.resolveIssue(i.id); s.toast({ title: 'Marked resolved', body: i.kind, level: 'ok' }) }}><CheckCheck size={13} />Resolve</Button></div> : <Badge tone="ok">Resolved</Badge>}
                </li>))}
            </ul>
          </Card>
          <Card title="Fleet health">
            <div className="flex flex-col gap-2 text-sm">{(['critical', 'high', 'medium', 'low'] as const).map(k => <div key={k} className="flex justify-between inset-glass px-3 py-2"><span className="capitalize">{k}</span><span className="tnum font-bold">{open.filter(i => i.sev === k).length}</span></div>)}
              <div className="flex justify-between inset-glass px-3 py-2"><span>Offline agents</span><span className="tnum font-bold">{Object.values(s.live).filter(l => l.status === 'offline').length}</span></div>
              <div className="flex justify-between inset-glass px-3 py-2"><span>Temp &gt; 85°C</span><span className="tnum font-bold">{Object.values(s.live).filter(l => l.cpuT > 85 || l.gpuT > 85).length}</span></div></div>
          </Card>
        </div>)}
    </div>
  )
}
export const _m = [Switch, statusColor]
