import { useState } from 'react'
import { X, Clock, Square, MonitorUp, MonitorPlay, Lock, Unlock, RotateCw, PowerOff, Zap, MessageSquare, LogOut, Power, Cpu, FlaskConical, Wifi, WifiOff, MoreHorizontal, Thermometer, LogIn, ShoppingBag, Timer, Play } from 'lucide-react'
import { useStore, statusColor, statusLabel } from '../../store/useStore'
import { Drawer, Dropdown } from '../ui/overlays'
import { Avatar, Badge, Button, Tabs, tierTone, Progress, Circular } from '../ui/core'
import { Sparkline } from '../ui/data'
import { Timeline } from '../ui/data'
import { Thumb } from '../monitoring/PcCard'
import { fmtTime, money } from '../../lib/utils'
import { gameIcon } from '../../services/mock'
import { runCmd, openDialog, buildMenu } from './actions'

const Stat = ({ k, v, sub, bad }: { k: string; v: string; sub?: string; bad?: boolean }) => <div className="inset-glass p-2.5"><div className="text-[10px] uppercase tracking-wider font-bold faint">{k}</div><div className="text-base font-bold tnum" style={bad ? { color: 'var(--bad)' } : undefined}>{v}</div>{sub && <div className="text-[10px] faint">{sub}</div>}</div>
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3 py-1.5 text-[12.5px] border-b border-white/5 last:border-0"><span className="muted">{k}</span><span className="font-medium text-right tnum">{v}</span></div>
const Meter = ({ k, v, unit = '%', spark, warn = 90 }: { k: string; v: number; unit?: string; spark?: number[]; warn?: number }) => (
  <div className="inset-glass p-2.5"><div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-wider font-bold faint">{k}</span><span className="text-sm font-bold tnum" style={{ color: v >= warn ? 'var(--bad)' : undefined }}>{Math.round(v)}{unit}</span></div>
    {spark ? <div className="mt-1"><Sparkline data={spark} w={120} h={26} color={v >= warn ? 'var(--bad)' : undefined} /></div> : <Progress value={unit === '%' ? v : (v / 110) * 100} className="mt-2" tone={v >= warn ? 'var(--bad)' : undefined} />}</div>
)

export function StationDrawer() {
  const id = useStore(s => s.drawerId), set = useStore(s => s.set), tab = useStore(s => s.drawerTab)
  const st = useStore(s => s.layout.stations.find(a => a.id === s.drawerId)), l = useStore(s => (s.drawerId ? s.live[s.drawerId] : null)), spec = useStore(s => (s.drawerId ? s.specs[s.drawerId] : null)), zone = useStore(s => s.layout.zones.find(z => z.id === st?.zone))
  const [thumbFrame] = useState(0)
  if (!id || !st || !l || !spec) return null
  const col = statusColor[l.status], off = l.status === 'offline', use = l.status === 'in-use'
  const ids = [id]
  const total = 7200, pct = use ? Math.min(100, (l.remaining / total) * 100) : 0
  const icons = { power: <Power size={9} />, login: <LogIn size={9} />, session: <Play size={9} />, time: <Timer size={9} />, order: <ShoppingBag size={9} />, extend: <Clock size={9} />, logout: <LogOut size={9} />, remote: <Lock size={9} /> }
  const header = (
    <header className="px-5 pt-4 pb-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl grid place-items-center font-bold border border-white/25" style={{ background: `color-mix(in srgb, ${col} 25%, transparent)`, color: col }}>{st.name.replace(/\D/g, '') || st.name.slice(0, 2)}</div>
        <div className="flex-1 min-w-0"><h2 className="text-lg font-bold leading-tight truncate">{st.name}</h2><div className="flex items-center gap-2 text-xs muted">{zone?.name ?? 'No zone'} · <span className="capitalize">{st.type}</span></div></div>
        <Dropdown align="end" trigger={<Button icon v="ghost" aria-label="More actions"><MoreHorizontal size={17} /></Button>} items={buildMenu(ids, false).filter(i => !('header' in i && i.header) || true)} />
        <Button icon v="ghost" onClick={() => set({ drawerId: null })} aria-label="Close drawer" data-close><X size={17} /></Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge tone={off ? 'bad' : 'ok'} dot>{off ? <><WifiOff size={10} />Offline</> : <><Wifi size={10} />Online · {Math.round(l.ping)}ms</>}</Badge>
        <span className="badge" style={{ color: col, borderColor: `color-mix(in srgb, ${col} 50%, transparent)`, background: `color-mix(in srgb, ${col} 14%, transparent)` }}>{statusLabel[l.status]}</span>
        <Badge tone="info"><FlaskConical size={10} />Simulated data</Badge>
      </div>
    </header>
  )
  return (
    <Drawer open onClose={() => set({ drawerId: null })} width={500} header={header} title={st.name}>
      <div className="px-5 py-3 sticky top-0 z-10"><Tabs size="sm" value={tab as 'overview'} onChange={v => set({ drawerTab: v })} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'hardware', label: 'Hardware' }, { id: 'remote', label: 'Remote' }, { id: 'history', label: 'History', count: l.history.length }]} /></div>
      <div className="px-5 pb-6 flex flex-col gap-4">
        {tab === 'overview' && <>
          <section className="glass p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider faint mb-2">User & session</div>
            {l.user ? <>
              <div className="flex items-center gap-3"><Avatar name={l.user} size={44} /><div className="flex-1 min-w-0"><div className="font-bold truncate">{l.user}</div><div className="flex gap-1.5 mt-0.5"><Badge tone={tierTone(l.tier)}>{l.tier}</Badge><Badge>{l.pkg}</Badge></div></div>
                <Circular value={pct} size={62} stroke={6} tone={pct < 15 ? 'var(--warn)' : undefined}><span className="text-[9px] leading-none">{Math.round(pct)}%</span></Circular></div>
              <div className="timer text-4xl mt-3 leading-none" style={{ color: l.remaining < 600 ? 'var(--warn)' : undefined }}>{l.pkg === 'Unlimited' ? '∞' : fmtTime(l.remaining)}<span className="text-[10px] font-bold tracking-widest faint ml-2">REMAINING</span></div>
              <div className="grid grid-cols-3 gap-2 mt-3"><Stat k="Started" v={l.startedAt ? new Date(l.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} /><Stat k="Cost" v={money(l.cost)} /><Stat k="Orders" v={String(l.orders)} /></div>
              <div className="flex gap-2 mt-3"><Button v="primary" className="flex-1" onClick={() => openDialog('addTime', ids)}><Clock size={14} />Add Time</Button><Button v="danger" className="flex-1" onClick={() => runCmd('endSession', ids)}><Square size={14} />End Session</Button></div>
            </> : <div className="py-2"><div className="font-semibold" style={{ color: col }}>{l.status === 'available' ? 'READY — no active session' : statusLabel[l.status]}</div><Button className="mt-3" v="primary" disabled={off} onClick={() => openDialog('start', ids)}><Play size={14} />Start Session</Button></div>}
          </section>
          <section className="glass p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider faint mb-2">Live application</div>
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl grid place-items-center text-2xl inset-glass">{gameIcon(l.game)}</div><div className="min-w-0 flex-1"><div className="font-bold truncate">{l.game}</div><div className="text-xs muted tnum truncate">{l.proc}</div></div><Badge tone={l.procStatus === 'Running' ? 'ok' : l.procStatus.includes('respond') ? 'bad' : undefined}>{l.procStatus}</Badge></div>
          </section>
          <section><div className="text-[11px] font-bold uppercase tracking-wider faint mb-2">Hardware telemetry</div><div className="grid grid-cols-2 gap-2">
            <Meter k="CPU usage" v={l.cpu} spark={l.sCpu} /><Meter k="GPU usage" v={l.gpu} spark={l.sGpu} /><Meter k="CPU temp" v={l.cpuT} unit="°C" warn={90} /><Meter k="GPU temp" v={l.gpuT} unit="°C" warn={90} />
            <Meter k="RAM" v={l.ram} /><Meter k="Disk" v={l.disk} warn={85} /><Meter k="Latency" v={l.ping} unit="ms" spark={l.sPing} warn={60} /><Stat k="Packet loss" v={`${l.loss.toFixed(1)}%`} bad={l.loss > 1} /><Stat k="FPS" v={l.fps ? String(l.fps) : '—'} /></div></section>
        </>}
        {tab === 'hardware' && <>
          <section className="glass p-4"><div className="text-[11px] font-bold uppercase tracking-wider faint mb-1">Hardware specifications</div>
            <Row k="CPU" v={spec.cpu} /><Row k="GPU" v={spec.gpu} /><Row k="RAM" v={spec.ram} /><Row k="Storage" v={spec.storage} /><Row k="Motherboard" v={spec.board} /><Row k="Monitor" v={spec.monitor} /><Row k="Refresh rate" v={`${spec.hz} Hz`} /><Row k="Windows" v={spec.os} /><Row k="Client agent" v={l.agent} /><Row k="Peripherals" v={spec.serial} /></section>
          <section className="glass p-4"><div className="text-[11px] font-bold uppercase tracking-wider faint mb-2">Installed games</div><div className="flex flex-wrap gap-1.5">{spec.games.map(g => <Badge key={g.n} tone={g.patch === 'current' ? 'ok' : g.patch === 'updating' ? 'info' : 'warn'}>{g.n} · {g.patch}</Badge>)}</div></section>
          <section className="grid grid-cols-2 gap-2"><Meter k="CPU temp" v={l.cpuT} unit="°C" /><Meter k="GPU temp" v={l.gpuT} unit="°C" /></section>
        </>}
        {tab === 'remote' && <>
          <section className="glass overflow-hidden"><div className="relative h-40"><Thumb live={l} seed={parseInt(id.split('-')[1] || '1')} frame={thumbFrame} /><div className="absolute left-2 bottom-2 badge info"><FlaskConical size={10} />Mock preview — real capture needs the Windows agent</div></div></section>
          <section className="grid grid-cols-2 gap-2">
            {([['Remote Desktop', MonitorUp, 'rdp'], ['View Live Screen', MonitorPlay, 'screen'], ['Lock', Lock, 'lock'], ['Unlock', Unlock, 'unlock'], ['Restart', RotateCw, 'restart'], ['Shutdown', PowerOff, 'shutdown'], ['Wake on LAN', Zap, 'wol'], ['Force Logout', LogOut, 'logout']] as const).map(([lab, Ic, c]) => (
              <Button key={c} v={c === 'shutdown' || c === 'logout' ? 'danger' : 'default'} disabled={off && c !== 'wol'} onClick={() => runCmd(c, ids)}><Ic size={14} />{lab}</Button>))}
            <Button className="col-span-2" disabled={off} onClick={() => openDialog('message', ids)}><MessageSquare size={14} />Send Message</Button>
          </section>
          <p className="text-[11px] faint">All remote controls are simulated: the browser cannot execute privileged Windows operations. Commands are routed through the agent command layer and would be delivered over WebSocket once the backend and client agent exist.</p>
        </>}
        {tab === 'history' && <section className="glass p-4"><div className="text-[11px] font-bold uppercase tracking-wider faint mb-3">Session history</div>
          <Timeline items={[...l.history].reverse().map(h => ({ t: new Date(h.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), title: h.text, icon: icons[h.kind] }))} /></section>}
      </div>
    </Drawer>
  )
}
export const _i = [Cpu, Thermometer]
