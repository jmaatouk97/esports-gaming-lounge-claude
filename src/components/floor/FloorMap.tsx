import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MousePointer2, Hand, Plus, SquareDashed, Armchair, Type, Ruler, Grid3x3, Magnet, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Save, RotateCcw, Trash2, Lock, Pencil, Activity, Monitor, Gamepad, Users, Mic, Rows3, Columns3, RotateCw, Check } from 'lucide-react'
import { useStore, statusColor, statusLabel } from '../../store/useStore'
import { Button, Glass, Badge, Tabs } from '../ui/core'
import { Popover, MenuList, Tooltip } from '../ui/overlays'
import { openDrawer, openStationMenu } from './actions'
import { fmtTime, cn, clamp } from '../../lib/utils'
import type { Layout, StationType, Zone } from '../../store/types'
import { NumberInput, Input } from '../ui/forms'

const GRID = 20
const WORLD = { w: 1440, h: 840 }
type Tool = 'select' | 'hand' | 'measure'
const typeIcon: Record<StationType, typeof Monitor> = { standard: Monitor, dual: Monitor, vip: Monitor, console: Gamepad, table: Users, stream: Mic }

const StationNode = memo(function StationNode({ st, edit, onDown, tool }: { st: Layout; edit: boolean; onDown: (e: React.PointerEvent, id: string) => void; tool: Tool }) {
  const l = useStore(s => s.live[st.id]), sel = useStore(s => s.selection.includes(st.id))
  const press = useRef<number>()
  if (!l) return null
  const col = statusColor[l.status], I = typeIcon[st.type], hot = l.cpuT > 90 || l.gpuT > 90
  return (
    <div className={cn('station-node', !edit && 'st-live cursor-pointer')} data-st={st.id}
      style={{ left: st.x, top: st.y, width: st.w, height: st.h, transform: `rotate(${st.rot}deg)`, zIndex: sel ? 5 : 2, cursor: edit ? (tool === 'select' ? 'grab' : undefined) : 'pointer' }}
      onPointerDown={e => { onDown(e, st.id); if (!edit && e.pointerType === 'touch') { const t = { x: e.clientX, y: e.clientY }; press.current = window.setTimeout(() => openStationMenu({ clientX: t.x, clientY: t.y, preventDefault() { }, stopPropagation() { } }, st.id, false), 520) } }}
      onPointerUp={() => clearTimeout(press.current)} onPointerMove={() => { }} onPointerCancel={() => clearTimeout(press.current)}
      onContextMenu={e => openStationMenu(e, st.id, edit)}
      onDoubleClick={() => { if (edit) useStore.setState({ dialog: { type: 'rename', ids: [st.id] } }) }}>
      <div className={cn('st-pc', sel && 'sel')} style={{ ['--st' as string]: col }} aria-label={`${st.name} ${statusLabel[l.status]}`}>
        <div className="flex items-center gap-1 leading-none"><I size={10} style={{ color: col }} /><span className="font-bold text-[10.5px]">{st.name.replace('PC-', '')}</span>{hot && <span style={{ color: 'var(--bad)' }} className="text-[10px] font-black">!</span>}</div>
        {st.w >= 52 && <div className="timer text-[9.5px] leading-none mt-0.5 opacity-90" style={{ color: l.status === 'in-use' ? undefined : col }}>{l.status === 'in-use' ? fmtTime(l.remaining).slice(l.remaining >= 3600 ? 0 : 3) : l.status === 'available' ? 'READY' : statusLabel[l.status]}</div>}
        {l.status === 'in-use' && st.h >= 40 && <div className="text-[8px] opacity-60 truncate max-w-full px-1 leading-none mt-0.5">{l.user}</div>}
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
      </div>
    </div>
  )
})

export function FloorMap({ height = '100%' }: { height?: string }) {
  const layout = useStore(s => s.layout), mode = useStore(s => s.floorMode), set = useStore(s => s.set), selection = useStore(s => s.selection)
  const st = useStore, patch = useStore(s => s.patchLayout), past = useStore(s => s.past.length), fut = useStore(s => s.future.length), dirty = useStore(s => s.dirty)
  const edit = mode === 'edit'
  const vp = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: 0, y: 0, z: 1 })
  const [tool, setTool] = useState<Tool>('select')
  const [grid, setGrid] = useState(true), [snapOn, setSnapOn] = useState(true)
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const [measure, setMeasure] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const viewRef = useRef(view); viewRef.current = view
  const stRef = useRef({ snapOn, edit, tool }); stRef.current = { snapOn, edit, tool }

  const fit = useCallback(() => {
    const el = vp.current; if (!el) return
    const r = el.getBoundingClientRect(), z = clamp(Math.min(r.width / WORLD.w, r.height / WORLD.h) * 0.96, .3, 2)
    setView({ z, x: (r.width - WORLD.w * z) / 2, y: (r.height - WORLD.h * z) / 2 })
  }, [])
  useEffect(() => { fit(); const ro = new ResizeObserver(fit); if (vp.current) ro.observe(vp.current); return () => ro.disconnect() }, [fit])

  const toWorld = (cx: number, cy: number) => { const r = vp.current!.getBoundingClientRect(), v = viewRef.current; return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z } }
  const sn = (v: number) => (stRef.current.snapOn ? Math.round(v / GRID) * GRID : Math.round(v))

  // wheel zoom
  useEffect(() => {
    const el = vp.current!
    const h = (e: WheelEvent) => {
      e.preventDefault(); const r = el.getBoundingClientRect(), v = viewRef.current
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) { const z = clamp(v.z * (e.deltaY < 0 ? 1.1 : .9), .25, 3), mx = e.clientX - r.left, my = e.clientY - r.top; setView({ z, x: mx - ((mx - v.x) / v.z) * z, y: my - ((my - v.y) / v.z) * z }) }
    }
    el.addEventListener('wheel', h, { passive: false }); return () => el.removeEventListener('wheel', h)
  }, [])
  const zoomBy = (f: number) => { const r = vp.current!.getBoundingClientRect(), v = viewRef.current, z = clamp(v.z * f, .25, 3), mx = r.width / 2, my = r.height / 2; setView({ z, x: mx - ((mx - v.x) / v.z) * z, y: my - ((my - v.y) / v.z) * z }) }

  // keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return
      const s = st.getState(); if (s.drawerId || s.dialog || s.menu) return
      if (!stRef.current.edit) { if (e.key === 'Escape') s.clearSel(); if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); s.select(s.layout.stations.map(a => a.id)) } return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo() }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo() }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); s.saveLayout() }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); s.select(s.layout.stations.map(a => a.id)) }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (s.selection.length) { e.preventDefault(); s.confirm(`Delete ${s.selection.length} object(s)?`, 'This can be undone with Ctrl+Z.', 'Delete', () => st.getState().deleteSelected()) } }
      else if (e.key === 'Escape') s.clearSel()
      else if (e.key.startsWith('Arrow') && s.selection.length) { e.preventDefault(); const d = e.shiftKey ? 20 : 5, dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0; s.patchLayout(l => { const sel = s.selection; [...l.stations, ...l.zones, ...l.furniture, ...l.labels].forEach(o => { if (sel.includes(o.id)) { o.x += dx; o.y += dy } }) }) }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [st])

  /* ---- drag machinery ---- */
  const dragStart = (e: React.PointerEvent, kind: 'move' | 'resize' | 'rotate' | 'zone-resize', id: string, extra?: { handle?: string }) => {
    e.stopPropagation()
    const s = st.getState(), startW = toWorld(e.clientX, e.clientY)
    const pickIds = kind === 'move' ? (s.selection.includes(id) ? s.selection : [id]) : [id]
    if (kind === 'move' && !s.selection.includes(id) && !(e.shiftKey || e.ctrlKey)) st.setState({ selection: [id] })
    if (kind === 'move' && (e.shiftKey || e.ctrlKey || e.metaKey) && !s.selection.includes(id)) st.setState({ selection: [...s.selection, id] })
    const orig = JSON.parse(JSON.stringify(s.layout)) as typeof s.layout
    let moved = false
    const find = (l: typeof orig, i: string) => l.stations.find(a => a.id === i) ?? l.zones.find(a => a.id === i) ?? l.furniture.find(a => a.id === i) ?? l.labels.find(a => a.id === i)
    const move = (ev: PointerEvent) => {
      const w = toWorld(ev.clientX, ev.clientY), dx = w.x - startW.x, dy = w.y - startW.y
      if (!moved && Math.hypot(dx, dy) * viewRef.current.z < 4) return
      if (!moved) { moved = true; st.getState().commit() }
      st.setState(cur => {
        const l = JSON.parse(JSON.stringify(cur.layout)) as typeof orig
        if (kind === 'move') {
          const ids = new Set(pickIds)
          // a zone drags its contained stations along
          const zs = l.zones.filter(z => ids.has(z.id)); const carry = new Set<string>()
          zs.forEach(z => { const oz = orig.zones.find(a => a.id === z.id)!; orig.stations.forEach(a => { if (a.zone === z.id || (a.x >= oz.x && a.x + a.w <= oz.x + oz.w && a.y >= oz.y && a.y + a.h <= oz.y + oz.h)) carry.add(a.id) }) })
          ;[...l.stations, ...l.zones, ...l.furniture, ...l.labels].forEach(o => { if (ids.has(o.id) || carry.has(o.id)) { const og = find(orig, o.id)!; o.x = sn(og.x + dx); o.y = sn(og.y + dy) } })
        } else if (kind === 'resize') {
          const o = find(l, id) as Layout | undefined, og = find(orig, id) as Layout; if (o) { o.w = Math.max(30, sn(og.w + dx)); o.h = Math.max(24, sn(og.h + dy)) }
        } else if (kind === 'zone-resize') {
          const o = l.zones.find(z => z.id === id), og = orig.zones.find(z => z.id === id)!; if (o) { o.w = Math.max(120, sn(og.w + dx)); o.h = Math.max(100, sn(og.h + dy)) }
        } else if (kind === 'rotate') {
          const o = find(l, id) as Layout | undefined, og = find(orig, id) as Layout; if (o) { const cx = og.x + og.w / 2, cy = og.y + og.h / 2; let a = (Math.atan2(w.y - cy, w.x - cx) * 180) / Math.PI + 90; if (!ev.altKey) a = Math.round(a / 15) * 15; o.rot = ((Math.round(a) % 360) + 360) % 360 }
        }
        return { layout: l, dirty: true }
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      if (moved && (kind === 'move' || kind === 'resize')) st.getState().assignZoneByPosition(st.getState().layout.stations.map(a => a.id).filter(i => pickIds.includes(i)))
      if (moved) st.setState({ dirty: true })
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  const onStationDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button === 2) return
    const { edit: ed, tool: tl } = stRef.current
    if (ed && tl === 'select' && e.button === 0) dragStart(e, 'move', id)
    else if (!ed) {
      e.stopPropagation()
      if (e.pointerType === 'touch') { /* click handler below */ }
      const el = e.currentTarget as HTMLElement, x0 = e.clientX, y0 = e.clientY
      const up = (ev: PointerEvent) => { window.removeEventListener('pointerup', up); if (ev.button === 0 && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) { const s = st.getState(); if (ev.shiftKey || ev.ctrlKey || ev.metaKey) s.toggleSel(id); else if (!s.menu) openDrawer(id) } void el }
      window.addEventListener('pointerup', up)
    }
    // eslint-disable-next-line
  }, [])

  const bgDown = (e: React.PointerEvent) => {
    if (e.button === 2) return
    const s = st.getState(), startC = { x: e.clientX, y: e.clientY }, v0 = viewRef.current, startW = toWorld(e.clientX, e.clientY)
    const panning = tool === 'hand' || e.button === 1 || !edit && !e.shiftKey
    if (tool === 'measure') {
      const m = (ev: PointerEvent) => { const w = toWorld(ev.clientX, ev.clientY); setMeasure({ x0: startW.x, y0: startW.y, x1: w.x, y1: w.y }) }
      const u = () => { window.removeEventListener('pointermove', m); window.removeEventListener('pointerup', u) }
      window.addEventListener('pointermove', m); window.addEventListener('pointerup', u); return
    }
    if (panning) {
      let moved = false
      const m = (ev: PointerEvent) => { const dx = ev.clientX - startC.x, dy = ev.clientY - startC.y; if (Math.hypot(dx, dy) > 3) moved = true; setView({ ...v0, x: v0.x + dx, y: v0.y + dy }) }
      const u = () => { window.removeEventListener('pointermove', m); window.removeEventListener('pointerup', u); if (!moved) s.clearSel() }
      window.addEventListener('pointermove', m); window.addEventListener('pointerup', u); return
    }
    // marquee
    const m = (ev: PointerEvent) => { const w = toWorld(ev.clientX, ev.clientY); setMarquee({ x0: startW.x, y0: startW.y, x1: w.x, y1: w.y }) }
    const u = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', m); window.removeEventListener('pointerup', u)
      const w = toWorld(ev.clientX, ev.clientY), x0 = Math.min(startW.x, w.x), x1 = Math.max(startW.x, w.x), y0 = Math.min(startW.y, w.y), y1 = Math.max(startW.y, w.y)
      setMarquee(null)
      if (x1 - x0 < 4 && y1 - y0 < 4) { if (!(ev.shiftKey)) st.getState().clearSel(); return }
      const hit = st.getState().layout.stations.filter(a => a.x + a.w > x0 && a.x < x1 && a.y + a.h > y0 && a.y < y1).map(a => a.id)
      st.getState().select(hit, ev.shiftKey)
    }
    window.addEventListener('pointermove', m); window.addEventListener('pointerup', u)
  }

  const center = () => { const r = vp.current!.getBoundingClientRect(), v = viewRef.current; return { x: sn((r.width / 2 - v.x) / v.z - 40), y: sn((r.height / 2 - v.y) / v.z - 30) } }
  const selStations = selection.filter(i => layout.stations.some(a => a.id === i))
  const one = selection.length === 1 ? selection[0] : null
  const selSt = one ? layout.stations.find(a => a.id === one) : undefined
  const selZone = one ? layout.zones.find(a => a.id === one) : undefined
  const stationEls = useMemo(() => layout.stations.map(s => <StationNode key={s.id} st={s} edit={edit} onDown={onStationDown} tool={tool} />), [layout.stations, edit, onStationDown, tool])
  const dist = measure ? Math.hypot(measure.x1 - measure.x0, measure.y1 - measure.y0) : 0

  const TB = ({ label, children, on, onClick, disabled }: { label: string; children: React.ReactNode; on?: boolean; onClick?: () => void; disabled?: boolean }) => <Tooltip text={label} side="bottom"><Button icon size="sm" v="ghost" on={on} aria-label={label} onClick={onClick} disabled={disabled}>{children}</Button></Tooltip>
  const stationTypes: [StationType, string][] = [['standard', 'Standard PC'], ['dual', 'Dual-monitor PC'], ['vip', 'VIP PC'], ['console', 'Console Station'], ['table', 'Group Gaming Table'], ['stream', 'Streaming Station']]

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={vp} className="floor-viewport glass w-full h-full" onPointerDown={bgDown} onContextMenu={e => e.preventDefault()} style={{ cursor: tool === 'hand' || !edit ? 'grab' : tool === 'measure' ? 'crosshair' : 'default' }}>
        {grid && <div className="floor-grid" style={{ backgroundImage: 'linear-gradient(rgba(var(--gc),.06) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--gc),.06) 1px,transparent 1px)', backgroundSize: `${GRID * view.z}px ${GRID * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px`, opacity: edit ? 1 : .45 }} />}
        <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, transform: `translate(${view.x}px,${view.y}px) scale(${view.z})`, transformOrigin: '0 0' }}>
          {layout.zones.map(z => {
            const sel = selection.includes(z.id), cnt = layout.stations.filter(a => a.zone === z.id).length
            return (
              <div key={z.id} className="zone-node" style={{ left: z.x, top: z.y, width: z.w, height: z.h, borderColor: `color-mix(in srgb, ${z.hue} ${sel ? 90 : 55}%, transparent)`, background: `color-mix(in srgb, ${z.hue} 8%, transparent)`, outline: sel ? `2px solid ${z.hue}` : undefined, outlineOffset: 2, pointerEvents: 'none' }}>
                <div className="absolute -top-3 left-4 px-2.5 h-6 rounded-full flex items-center gap-1.5 text-[11px] font-bold border" onPointerDown={e => { if (edit && tool === 'select' && e.button === 0) { st.setState({ selection: [z.id] }); dragStart(e, 'move', z.id) } }} onContextMenu={e => { if (edit) { e.preventDefault(); e.stopPropagation(); st.setState({ selection: [z.id], menu: { x: e.clientX, y: e.clientY, ids: [z.id], edit: true, kind: 'zone' } }) } }} style={{ pointerEvents: 'auto', cursor: edit ? 'grab' : 'default', background: `color-mix(in srgb, ${z.hue} 30%, rgba(14,17,36,.85))`, borderColor: `color-mix(in srgb, ${z.hue} 60%, transparent)`, color: '#fff' }}><i className="w-1.5 h-1.5 rounded-full" style={{ background: z.hue }} />{z.name}<span className="opacity-60 tnum">{cnt}</span></div>
                {edit && sel && <div className="absolute -right-2 -bottom-2 w-4 h-4 rounded-md border-2 border-white cursor-nwse-resize" style={{ background: z.hue, pointerEvents: 'auto' }} onPointerDown={e => dragStart(e, 'zone-resize', z.id)} aria-label="Resize zone" />}
              </div>)
          })}
          {layout.furniture.map(f => <div key={f.id} className="absolute rounded-lg grid place-items-center text-[9px] font-bold uppercase tracking-wider faint" style={{ left: f.x, top: f.y, width: f.w, height: f.h, transform: `rotate(${f.rot}deg)`, background: f.kind === 'plant' ? 'rgba(52,211,153,.25)' : 'rgba(var(--gc),.1)', border: `1px solid ${selection.includes(f.id) ? 'var(--accent)' : 'rgba(var(--gc),.2)'}`, borderRadius: f.kind === 'plant' ? '50%' : 8, cursor: edit && tool === 'select' ? 'grab' : 'default', zIndex: 1 }}
            onPointerDown={e => { if (edit && tool === 'select' && e.button === 0) { st.setState({ selection: [f.id] }); dragStart(e, 'move', f.id) } }} onContextMenu={e => { if (edit) { e.preventDefault(); e.stopPropagation(); st.setState({ selection: [f.id], menu: { x: e.clientX, y: e.clientY, ids: [f.id], edit: true, kind: 'canvas' } }) } }}>{f.kind !== 'plant' && f.kind}</div>)}
          {layout.labels.map(l => <div key={l.id} className="absolute text-xs font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ left: l.x, top: l.y, zIndex: 1, outline: selection.includes(l.id) ? '1px solid var(--accent)' : undefined, cursor: edit && tool === 'select' ? 'grab' : 'default', color: 'var(--muted)' }}
            onPointerDown={e => { if (edit && tool === 'select' && e.button === 0) { st.setState({ selection: [l.id] }); dragStart(e, 'move', l.id) } }}
            onDoubleClick={() => { if (edit) { const t = prompt('Label text', l.text); if (t) patch(x => { const o = x.labels.find(a => a.id === l.id); if (o) o.text = t }, true) } }}>{l.text}</div>)}
          {stationEls}
          {edit && selSt && selStations.length === 1 && <>
            <div className="absolute w-4 h-4 rounded-md border-2 border-white cursor-nwse-resize z-20" style={{ left: selSt.x + selSt.w - 6, top: selSt.y + selSt.h - 6, background: 'var(--accent)' }} onPointerDown={e => dragStart(e, 'resize', selSt.id)} aria-label="Resize" />
            <div className="absolute w-4 h-4 rounded-full border-2 border-white cursor-grab z-20 grid place-items-center" style={{ left: selSt.x + selSt.w / 2 - 8, top: selSt.y - 26, background: 'var(--accent2)' }} onPointerDown={e => dragStart(e, 'rotate', selSt.id)} aria-label="Rotate"><RotateCw size={9} color="#000" /></div>
          </>}
          {marquee && <div className="absolute border border-dashed z-30 pointer-events-none" style={{ left: Math.min(marquee.x0, marquee.x1), top: Math.min(marquee.y0, marquee.y1), width: Math.abs(marquee.x1 - marquee.x0), height: Math.abs(marquee.y1 - marquee.y0), borderColor: 'var(--accent)', background: 'color-mix(in srgb,var(--accent) 14%,transparent)' }} />}
          {measure && <svg className="absolute inset-0 pointer-events-none z-30" width={WORLD.w} height={WORLD.h}><line x1={measure.x0} y1={measure.y0} x2={measure.x1} y2={measure.y1} stroke="var(--accent2)" strokeWidth={2 / view.z} strokeDasharray="6 4" /><text x={(measure.x0 + measure.x1) / 2 + 8} y={(measure.y0 + measure.y1) / 2 - 8} fill="var(--text)" fontSize={13 / view.z} fontWeight={700}>{(dist / 40).toFixed(1)} m ({Math.round(dist)} px)</text></svg>}
        </div>
        {/* mode banner */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none"><Badge tone={edit ? 'warn' : 'ok'} dot>{edit ? 'Edit Mode · layout' : 'Live Operations'}</Badge>{dirty && edit && <Badge tone="warn">Unsaved</Badge>}</div>
        <div className="absolute bottom-3 left-3 flex gap-2 text-[10px] font-semibold pointer-events-none flex-wrap max-w-[60%]">{(['available', 'in-use', 'locked', 'reserved', 'offline', 'maintenance'] as const).map(k => <span key={k} className="flex items-center gap-1 glass-lite !rounded-full px-2 py-0.5"><i className="dot" style={{ background: statusColor[k], width: 6, height: 6 }} />{statusLabel[k]}</span>)}</div>
      </div>

      {/* floating toolbar */}
      <Glass m="deep" className="absolute top-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-24px)] p-1 flex items-center gap-0.5 overflow-x-auto noscroll-x z-10" role="toolbar" aria-label="Floor toolbar">
        <Tabs size="sm" value={mode} onChange={v => { set({ floorMode: v }); if (v === 'live') { setTool('select') } }} tabs={[{ id: 'live', label: 'Live', icon: <Activity size={13} /> }, { id: 'edit', label: 'Edit', icon: <Pencil size={13} /> }]} />
        <span className="w-px h-5 mx-1" style={{ background: 'rgba(var(--gc),.2)' }} />
        {edit && <>
          <TB label="Select tool" on={tool === 'select'} onClick={() => setTool('select')}><MousePointer2 size={15} /></TB>
          <TB label="Move / pan tool" on={tool === 'hand'} onClick={() => setTool('hand')}><Hand size={15} /></TB>
          <Popover trigger={<span><TB label="Add PC / station"><Plus size={15} /></TB></span>}>{close => <MenuList onDone={close} items={stationTypes.map(([t, l]) => ({ label: l, onClick: () => { const c = center(); st.getState().addStation(t, c.x, c.y) } }))} />}</Popover>
          <TB label="Add zone" onClick={() => { const c = center(); st.getState().addZone(c.x - 100, c.y - 60) }}><SquareDashed size={15} /></TB>
          <Popover trigger={<span><TB label="Add furniture"><Armchair size={15} /></TB></span>}>{close => <MenuList onDone={close} items={(['desk', 'sofa', 'counter', 'plant', 'wall'] as const).map(k => ({ label: k[0].toUpperCase() + k.slice(1), onClick: () => { const c = center(); st.getState().addFurniture(k, c.x, c.y) } }))} />}</Popover>
          <TB label="Text label" onClick={() => { const c = center(); st.getState().addLabel(c.x, c.y) }}><Type size={15} /></TB>
          <TB label="Measure tool" on={tool === 'measure'} onClick={() => { setTool(tool === 'measure' ? 'select' : 'measure'); setMeasure(null) }}><Ruler size={15} /></TB>
          <span className="w-px h-5 mx-1" style={{ background: 'rgba(var(--gc),.2)' }} />
        </>}
        <TB label="Toggle grid" on={grid} onClick={() => setGrid(!grid)}><Grid3x3 size={15} /></TB>
        {edit && <TB label="Snap to grid" on={snapOn} onClick={() => setSnapOn(!snapOn)}><Magnet size={15} /></TB>}
        {edit && <><TB label="Undo (Ctrl+Z)" disabled={!past} onClick={() => st.getState().undo()}><Undo2 size={15} /></TB><TB label="Redo (Ctrl+Shift+Z)" disabled={!fut} onClick={() => st.getState().redo()}><Redo2 size={15} /></TB></>}
        <span className="w-px h-5 mx-1" style={{ background: 'rgba(var(--gc),.2)' }} />
        <TB label="Zoom out" onClick={() => zoomBy(.85)}><ZoomOut size={15} /></TB><span className="text-[11px] tnum w-9 text-center font-semibold">{Math.round(view.z * 100)}%</span><TB label="Zoom in" onClick={() => zoomBy(1.18)}><ZoomIn size={15} /></TB><TB label="Fit to screen" onClick={fit}><Maximize size={15} /></TB>
        {edit && <><span className="w-px h-5 mx-1" style={{ background: 'rgba(var(--gc),.2)' }} />
          <Button size="sm" v="primary" onClick={() => st.getState().saveLayout()}><Save size={14} />Save</Button>
          <TB label="Reset layout" onClick={() => st.getState().confirm('Reset floor layout?', 'All station positions, zones and furniture return to the default layout.', 'Reset', () => st.getState().resetLayout())}><RotateCcw size={15} /></TB></>}
      </Glass>

      {/* inspector */}
      {edit && (selSt || selZone || selStations.length > 1) && (
        <Glass m="deep" className="absolute right-3 top-16 w-60 p-3 z-10 flex flex-col gap-2.5 max-h-[calc(100%-110px)] overflow-y-auto" role="region" aria-label="Inspector">
          {selSt && <>
            <div className="flex items-center justify-between"><span className="font-bold text-sm">{selSt.name}</span><Badge>{selSt.type}</Badge></div>
            <div className="grid grid-cols-2 gap-2"><NumberInput label="X" value={Math.round(selSt.x)} min={0} max={WORLD.w} step={GRID} onChange={v => patch(l => { const o = l.stations.find(a => a.id === selSt.id)!; o.x = v }, true)} /><NumberInput label="Y" value={Math.round(selSt.y)} min={0} max={WORLD.h} step={GRID} onChange={v => patch(l => { const o = l.stations.find(a => a.id === selSt.id)!; o.y = v }, true)} />
              <NumberInput label="Width" value={Math.round(selSt.w)} min={30} max={400} step={10} onChange={v => patch(l => { const o = l.stations.find(a => a.id === selSt.id)!; o.w = v }, true)} /><NumberInput label="Height" value={Math.round(selSt.h)} min={24} max={300} step={10} onChange={v => patch(l => { const o = l.stations.find(a => a.id === selSt.id)!; o.h = v }, true)} /></div>
            <NumberInput label="Rotation °" value={selSt.rot} min={0} max={359} step={15} onChange={v => patch(l => { const o = l.stations.find(a => a.id === selSt.id)!; o.rot = v }, true)} />
          </>}
          {selZone && <><Input label="Zone name" value={selZone.name} onChange={e => patch(l => { const o = l.zones.find(a => a.id === selZone.id)!; o.name = e.target.value })} onBlur={() => st.getState().commit()} />
            <div className="flex flex-wrap gap-1.5">{['#6F9DFF', '#F43F5E', '#D946EF', '#10B981', '#F59E0B', '#22D3EE', '#8B5CF6'].map(c => <button key={c} aria-label={c} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: selZone.hue === c ? '#fff' : 'transparent' }} onClick={() => patch(l => { l.zones.find(a => a.id === selZone.id)!.hue = c }, true)} />)}</div>
            <div className="grid grid-cols-2 gap-2"><NumberInput label="Width" value={selZone.w} min={120} max={1400} step={20} onChange={v => patch(l => { l.zones.find(a => a.id === selZone.id)!.w = v }, true)} /><NumberInput label="Height" value={selZone.h} min={100} max={800} step={20} onChange={v => patch(l => { l.zones.find(a => a.id === selZone.id)!.h = v }, true)} /></div></>}
          {selStations.length > 1 && <><div className="font-bold text-sm">{selStations.length} stations</div>
            <div className="flex gap-1.5"><Button size="sm" className="flex-1" onClick={() => st.getState().arrange(selStations, 'row', 8)}><Rows3 size={13} />Row</Button><Button size="sm" className="flex-1" onClick={() => st.getState().arrange(selStations, 'col', 8)}><Columns3 size={13} />Column</Button></div>
            <div className="flex gap-1.5"><Button size="sm" className="flex-1" onClick={() => st.getState().arrange(selStations, 'row', 24)}>Spread +</Button><Button size="sm" className="flex-1" onClick={() => st.getState().arrange(selStations, 'row', 0)}>Pack</Button></div></>}
          <Button size="sm" v="danger" onClick={() => st.getState().confirm(`Delete ${selection.length} object(s)?`, 'This can be undone with Undo.', 'Delete', () => st.getState().deleteSelected())}><Trash2 size={13} />Delete</Button>
        </Glass>
      )}
      {!edit && <div className="absolute bottom-3 right-3 glass-lite !rounded-xl px-3 py-1.5 text-[10.5px] muted hidden sm:flex items-center gap-1.5 pointer-events-none"><Lock size={10} />Click = details · Right-click = menu · Drag = pan · Shift+drag = select · Shift+click = multi-select</div>}
      {!edit && selStations.length === 0 && null}
      <span className="hidden"><Check /></span>
    </div>
  )
}
export type { Zone }
