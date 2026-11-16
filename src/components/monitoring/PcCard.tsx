import { memo, useEffect, useRef, useState } from 'react'
import { MoreVertical, Check, MonitorUp, Zap, RotateCw, Lock, Clock, MessageSquare, WifiOff, Thermometer, FlaskConical } from 'lucide-react'
import { useStore, statusColor, statusLabel, type Density } from '../../store/useStore'
import { fmtTime, cn, mulberry } from '../../lib/utils'
import { gameIcon } from '../../services/mock'
import { Sparkline, MicroBar } from '../ui/data'
import { Tooltip } from '../ui/overlays'
import { openDrawer, openStationMenu, runCmd, openDialog } from '../floor/actions'
import type { Live } from '../../store/types'

/** Pseudo screenshot generated from CSS gradients (demo only — real capture needs the Windows agent). */
export function Thumb({ live, seed, frame }: { live: Live; seed: number; frame: number }) {
  const r = mulberry(seed * 97 + frame * 13 + 1)
  const hue = { Valorant: 350, 'Counter-Strike 2': 35, 'Dota 2': 5, 'League of Legends': 200, Fortnite: 270, 'Apex Legends': 15, 'Rocket League': 215, 'EA FC 25': 140 }[live.game] ?? 220
  if (live.status === 'offline') return <div className="absolute inset-0 grid place-items-center" style={{ background: '#0a0b14' }}><WifiOff size={22} color="#64748b" /></div>
  if (!live.user) return <div className="absolute inset-0" style={{ background: `radial-gradient(60% 80% at 50% 40%, hsl(${hue || 220} 50% 28%), #0b0d1a)` }}><div className="absolute inset-0 grid place-items-center text-[10px] font-bold tracking-widest text-white/50">{live.status === 'locked' ? 'LOCK SCREEN' : 'DESKTOP'}</div></div>
  const blobs = Array.from({ length: 4 }, () => `radial-gradient(${20 + r() * 30}% ${25 + r() * 30}% at ${r() * 100}% ${r() * 100}%, hsl(${hue + r() * 40 - 20} 70% ${35 + r() * 20}% / .85), transparent)`)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `${blobs.join(',')}, linear-gradient(${r() * 360}deg, hsl(${hue} 55% 14%), hsl(${hue + 30} 50% 8%))`, transition: 'background .6s' }}>
      <div className="absolute w-3 h-3 rounded-full border border-white/80" style={{ left: `${30 + r() * 40}%`, top: `${30 + r() * 40}%` }} />
      <div className="absolute left-1.5 bottom-1.5 w-12 h-1.5 rounded bg-green-400/70" /><div className="absolute right-1.5 top-1.5 text-[8px] font-bold text-white/70 tnum">{live.fps} FPS</div>
      <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px)' }} />
    </div>
  )
}

export const rangeCtx: { order: string[]; last: string | null } = { order: [], last: null }
function rangeSelect(id: string) {
  const st = useStore.getState(), o = rangeCtx.order, a = o.indexOf(rangeCtx.last ?? ''), b = o.indexOf(id)
  if (a < 0 || b < 0) { st.toggleSel(id); rangeCtx.last = id; return }
  st.select(o.slice(Math.min(a, b), Math.max(a, b) + 1), true); rangeCtx.last = id
}
function useSeen() {
  const ref = useRef<HTMLDivElement>(null), [seen, set] = useState(false)
  useEffect(() => { if (!ref.current || seen) return; const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { set(true); io.disconnect() } }, { rootMargin: '200px' }); io.observe(ref.current); return () => io.disconnect() }, [seen])
  return [ref, seen] as const
}

const QUICK = [
  { icon: MonitorUp, label: 'Remote Desktop', run: (id: string) => { runCmd('rdp', [id]); openDrawer(id, 'remote') } },
  { icon: Zap, label: 'Wake on LAN', run: (id: string) => runCmd('wol', [id]) }, { icon: RotateCw, label: 'Restart', run: (id: string) => runCmd('restart', [id]) },
  { icon: Lock, label: 'Lock', run: (id: string) => runCmd('lock', [id]) }, { icon: Clock, label: 'Add Time', run: (id: string) => openDialog('addTime', [id]) }, { icon: MessageSquare, label: 'Message', run: (id: string) => openDialog('message', [id]) },
]

export const PcCard = memo(function PcCard({ id, name, density, thumb, frame, interactive = true, selectedOverride }: { id: string; name: string; density: Density; thumb?: boolean; frame?: number; interactive?: boolean; selectedOverride?: boolean }) {
  const l = useStore(s => s.live[id]), sel = useStore(s => s.selection.includes(id)), toggle = useStore(s => s.toggleSel), paused = useStore(s => s.thumbPaused)
  const [ref, seen] = useSeen()
  if (!l) return null
  const selected = selectedOverride ?? sel
  const col = statusColor[l.status], hot = l.cpuT > 90 || l.gpuT > 90, vacant = !l.user
  const seed = parseInt(id.split('-')[1] || '1')
  const compact = density === 'compact', detailed = density === 'detailed'
  const click = (e: React.MouseEvent) => {
    if (!interactive) return
    if (e.shiftKey) { rangeSelect(id); return }
    if (e.ctrlKey || e.metaKey) { toggle(id); rangeCtx.last = id; return }
    openDrawer(id)
  }
  const press = useRef<number>()
  return (
    <div ref={ref} role="button" tabIndex={0} aria-label={`${name}, ${statusLabel[l.status]}${l.user ? ', ' + l.user : ''}`} aria-pressed={selected}
      onClick={click} onKeyDown={e => { if (e.key === 'Enter') openDrawer(id); if (e.key === ' ') { e.preventDefault(); toggle(id) } if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); openStationMenu({ clientX: r.left + 20, clientY: r.top + 20, preventDefault() { e.preventDefault() }, stopPropagation() { } }, id, false) } }}
      onContextMenu={e => interactive && openStationMenu(e, id, false)}
      onTouchStart={e => { const t = e.touches[0]; press.current = window.setTimeout(() => openStationMenu({ clientX: t.clientX, clientY: t.clientY, preventDefault() { }, stopPropagation() { } }, id, false), 520) }}
      onTouchEnd={() => clearTimeout(press.current)} onTouchMove={() => clearTimeout(press.current)}
      className={cn('pc-card glass-lite overflow-hidden focus-ring', selected && 'sel')} style={{ ['--st' as string]: col, borderColor: selected ? undefined : `color-mix(in srgb, ${col} 35%, transparent)`, borderRadius: compact ? 14 : 16 }}>
      {thumb && seen && <div className="absolute inset-0 opacity-90"><Thumb live={l} seed={seed} frame={paused ? 0 : frame ?? 0} /></div>}
      {thumb && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,18,.78), rgba(5,7,18,.15) 45%, rgba(5,7,18,.85))' }} />}
      <div className={cn('relative flex flex-col gap-1', compact ? 'p-2' : 'p-3 gap-1.5')} style={thumb ? { color: '#fff' } : undefined}>
        {/* header */}
        <div className="flex items-center gap-1.5">
          <button aria-label={`Select ${name}`} aria-checked={selected} role="checkbox" onClick={e => { e.stopPropagation(); if (e.shiftKey) rangeSelect(id); else { toggle(id); rangeCtx.last = id } }} className={cn('cb', selected && 'on')} style={{ width: 15, height: 15 }}>{selected && <Check size={10} color="#fff" strokeWidth={3.5} />}</button>
          <span className="font-bold text-[12.5px] tracking-tight truncate">{name}</span>
          {l.status === 'offline' ? <WifiOff size={11} className="faint" /> : <i className="dot live" style={{ width: 6, height: 6, background: col, color: col }} />}
          <span className="flex-1" />
          {hot && <Tooltip text="Temperature above 90°C"><Thermometer size={12} style={{ color: 'var(--bad)' }} /></Tooltip>}
          <span className="tnum text-[10.5px]" style={{ color: l.ping > 60 ? 'var(--bad)' : undefined, opacity: l.status === 'offline' ? .4 : .85 }}>{l.status === 'offline' ? '—' : `${Math.round(l.ping)}ms`}</span>
          <button aria-label={`More actions for ${name}`} className="muted -mr-1 p-0.5 rounded hover:bg-white/10" onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); openStationMenu({ clientX: r.left, clientY: r.bottom + 4, preventDefault() { }, stopPropagation() { } }, id, false) }}><MoreVertical size={14} /></button>
        </div>
        {/* user & session */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className={cn('truncate font-semibold', compact ? 'text-[12px]' : 'text-[13px]')} style={vacant ? { color: l.status === 'available' ? 'var(--ok)' : col } : undefined}>{l.user ?? (l.status === 'available' ? 'READY' : statusLabel[l.status])}</div>
            {!compact && <div className="text-[10.5px] opacity-70 truncate">{l.pkg ? `${l.pkg} · ${l.tier}` : l.status === 'available' ? 'Vacant' : l.agent === 'disconnected' ? 'Agent disconnected' : 'Not in session'}</div>}
          </div>
          {l.user && <div className="text-right shrink-0"><div className={cn('timer leading-none', compact ? 'text-[15px]' : 'text-lg')} style={{ color: l.remaining < 600 && l.pkg !== 'Unlimited' ? 'var(--warn)' : undefined }}>{l.pkg === 'Unlimited' ? '∞' : fmtTime(l.remaining)}</div>{!compact && <div className="text-[9px] font-bold tracking-widest opacity-60">REMAINING</div>}</div>}
        </div>
        {/* game strip */}
        <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px]" style={{ background: thumb ? 'rgba(0,0,0,.35)' : 'rgba(var(--gc),.06)' }}>
          <span aria-hidden>{gameIcon(l.game)}</span><span className="truncate flex-1 font-medium">{l.game}</span>
          {!compact && <span className="opacity-60 text-[10px] truncate max-w-[40%]">{l.procStatus}</span>}
          {compact && l.user && l.pkg && <span className="opacity-60 text-[9px] uppercase font-bold">{l.pkg.slice(0, 4)}</span>}
        </div>
        {/* telemetry */}
        {l.status !== 'offline' && (compact ? (
          <div className="flex items-center gap-2 text-[10px] tnum opacity-90">
            <span className="flex items-center gap-1" style={{ color: l.cpuT > 85 ? 'var(--bad)' : undefined }}>C{Math.round(l.cpuT)}°<MicroBar value={l.cpu} w={22} /></span>
            <span className="flex items-center gap-1" style={{ color: l.gpuT > 85 ? 'var(--bad)' : undefined }}>G{Math.round(l.gpuT)}°<MicroBar value={l.gpu} w={22} /></span>
            {l.fps > 0 && <span className="ml-auto opacity-70">{l.fps}fps</span>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] tnum">
            {([['CPU', l.cpu, `${Math.round(l.cpu)}%`, l.sCpu], ['GPU', l.gpu, `${Math.round(l.gpu)}%`, l.sGpu], ['RAM', l.ram, `${Math.round(l.ram)}%`, null], ['PING', Math.min(100, l.ping), `${Math.round(l.ping)}ms`, l.sPing]] as const).map(([k, v, t, sp]) => (
              <div key={k} className="flex items-center gap-1"><span className="opacity-60 w-6">{k}</span><MicroBar value={v} w={detailed ? 30 : 40} warn={k === 'PING' ? 60 : 90} />{sp && detailed ? <Sparkline data={sp as number[]} w={30} h={12} /> : null}<span className="ml-auto">{t}</span></div>
            ))}
            <div className="flex items-center gap-1"><span className="opacity-60 w-6">CPU°</span><span style={{ color: l.cpuT > 85 ? 'var(--bad)' : undefined }}>{Math.round(l.cpuT)}°C</span></div>
            <div className="flex items-center gap-1"><span className="opacity-60 w-6">GPU°</span><span style={{ color: l.gpuT > 85 ? 'var(--bad)' : undefined }}>{Math.round(l.gpuT)}°C</span>{l.fps > 0 && <span className="ml-auto">{l.fps} FPS</span>}</div>
            {detailed && <><div className="flex items-center gap-1"><span className="opacity-60 w-6">DISK</span><MicroBar value={l.disk} w={40} warn={85} /><span className="ml-auto">{Math.round(l.disk)}%</span></div><div className="flex items-center gap-1"><span className="opacity-60 w-6">LOSS</span><span style={{ color: l.loss > 1 ? 'var(--bad)' : undefined }}>{l.loss.toFixed(1)}%</span><span className="ml-auto opacity-60">{l.agent.includes('sim') ? 'sim' : ''}</span></div></>}
          </div>
        ))}
      </div>
      {/* hover quick actions */}
      {interactive && (
        <div className="hover-actions absolute left-1/2 -translate-x-1/2 bottom-1 glass !rounded-xl flex items-center gap-0.5 p-0.5 z-10" onClick={e => e.stopPropagation()} style={{ ['--blur' as string]: '10px' }}>
          {QUICK.map(q => <button key={q.label} aria-label={`${q.label} ${name}`} title={q.label} onClick={() => q.run(id)} className="w-6 h-6 rounded-lg grid place-items-center hover:bg-white/20 transition-colors" style={{ color: 'var(--text)' }}><q.icon size={13} /></button>)}
        </div>
      )}
      {thumb && <span className="absolute top-1 right-8 badge info !h-4 !text-[8px] hidden"><FlaskConical size={8} />sim</span>}
    </div>
  )
})
