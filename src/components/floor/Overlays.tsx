import { useState } from 'react'
import { Lock, Unlock, RotateCw, PowerOff, MessageSquare, LogOut, Zap, X, FlaskConical } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { ContextMenu, Modal } from '../ui/overlays'
import { Button, Glass, Badge } from '../ui/core'
import { Input, NumberInput, Select, Textarea, Combobox } from '../ui/forms'
import { buildMenu, runCmd } from './actions'
import { StationDrawer } from './StationDrawer'
import type { StationType } from '../../store/types'

export function BatchBar({ className = '' }: { className?: string }) {
  const sel = useStore(s => s.selection), stations = useStore(s => s.layout.stations), clear = useStore(s => s.clearSel), set = useStore(s => s.set)
  const ids = sel.filter(id => stations.some(a => a.id === id))
  if (!ids.length) return null
  return (
    <div className={`fixed z-40 left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 max-w-[calc(100vw-16px)] ${className}`} style={{ animation: 'toastIn .3s cubic-bezier(.23,1,.32,1)' }}>
      <Glass m="deep" className="flex items-center gap-1.5 p-2 pl-4 overflow-x-auto noscroll-x" role="toolbar" aria-label="Batch actions">
        <span className="text-[13px] font-bold whitespace-nowrap pr-2 tnum"><span style={{ color: 'var(--accent)' }}>{ids.length}</span> selected</span>
        <Badge tone="info" className="hidden sm:inline-flex"><FlaskConical size={10} />Simulated</Badge>
        {([['Lock', Lock, () => runCmd('lock', ids)], ['Unlock', Unlock, () => runCmd('unlock', ids)], ['Restart', RotateCw, () => runCmd('restart', ids)], ['Shutdown', PowerOff, () => runCmd('shutdown', ids)], ['Message', MessageSquare, () => set({ dialog: { type: 'message', ids } })], ['Logout', LogOut, () => runCmd('logout', ids)], ['Wake', Zap, () => runCmd('wol', ids)]] as const).map(([l, I, f]) => (
          <Button key={l} size="sm" v={l === 'Shutdown' || l === 'Logout' ? 'danger' : 'default'} onClick={f as () => void}><I size={13} />{l}</Button>))}
        <Button size="sm" v="ghost" icon onClick={clear} aria-label="Clear selection"><X size={14} /></Button>
      </Glass>
    </div>
  )
}

function Dialogs() {
  const dialog = useStore(s => s.dialog), set = useStore(s => s.set), members = useStore(s => s.members), layout = useStore(s => s.layout), run = useStore(s => s.run), patch = useStore(s => s.patchLayout)
  const close = () => set({ dialog: null })
  const [mins, setMins] = useState(30), [text, setText] = useState(''), [member, setMember] = useState(''), [hours, setHours] = useState(1), [pkg, setPkg] = useState('Hourly'), [zone, setZone] = useState(''), [name, setName] = useState(''), [type, setType] = useState<StationType>('standard'), [touched, setTouched] = useState(false)
  if (!dialog) return null
  const reset = () => { setTouched(false) }
  if (dialog.type === 'confirm') return (
    <Modal onClose={close} size="sm" title={dialog.title} footer={<><Button onClick={close}>Cancel</Button><Button v={dialog.danger ? 'danger' : 'primary'} onClick={() => { dialog.run(); close() }} data-autofocus>{dialog.confirm}</Button></>}>
      <p className="whitespace-pre-line muted">{dialog.body}</p></Modal>)
  const ids = dialog.ids, names = ids.map(i => layout.stations.find(a => a.id === i)?.name ?? i).join(', ')
  const done = (fn: () => void) => { fn(); close(); reset() }
  const memOpts = members.map(m => ({ value: m.id, label: m.user, hint: m.tier }))
  const m = members.find(x => x.id === member)
  switch (dialog.type) {
    case 'addTime': case 'removeTime': {
      const add = dialog.type === 'addTime'
      return <Modal onClose={close} size="sm" title={add ? 'Add time' : 'Remove time'} footer={<><Button onClick={close}>Cancel</Button><Button v="primary" onClick={() => done(() => run(add ? 'addTime' : 'removeTime', ids, { minutes: mins }))}>{add ? 'Add' : 'Remove'} {mins} min</Button></>}>
        <p className="sub mb-3 truncate">{names}</p><div className="flex gap-1.5 mb-3 flex-wrap">{[15, 30, 60, 120].map(v => <Button key={v} size="sm" on={mins === v} onClick={() => setMins(v)}>{v} min</Button>)}</div><NumberInput label="Minutes" value={mins} min={1} max={600} step={5} onChange={setMins} /></Modal>
    }
    case 'message':
      return <Modal onClose={close} size="md" title={`Send message · ${ids.length} station${ids.length > 1 ? 's' : ''}`} footer={<><Button onClick={close}>Cancel</Button><Button v="primary" onClick={() => { setTouched(true); if (text.trim()) done(() => run('message', ids, { text })) }}>Send</Button></>}>
        <Textarea label="Message shown on the player's screen" value={text} onChange={e => setText(e.target.value)} placeholder="Your session ends in 5 minutes…" data-autofocus />{touched && !text.trim() && <p className="text-[11px] mt-1" style={{ color: 'var(--bad)' }}>Message cannot be empty</p>}
        <div className="flex gap-1.5 mt-2 flex-wrap">{['Session ending in 5 min', 'Please keep the noise down', 'Come to the counter'].map(t => <Button key={t} size="sm" v="ghost" onClick={() => setText(t)}>{t}</Button>)}</div></Modal>
    case 'assign':
      return <Modal onClose={close} title="Assign member" footer={<><Button onClick={close}>Cancel</Button><Button v="primary" disabled={!m} onClick={() => done(() => run('assignMember', ids, { user: m!.user, tier: m!.tier }))}>Assign</Button></>}><Combobox label="Member" value={member} options={memOpts} onChange={setMember} />{m && <p className="sub mt-3">{m.tier} · wallet ${m.wallet.toFixed(2)} · {m.hours}h remaining</p>}</Modal>
    case 'start':
      return <Modal onClose={close} title={`Start session · ${names}`} footer={<><Button onClick={close}>Cancel</Button><Button v="primary" onClick={() => done(() => run('startSession', ids, { user: m?.user ?? 'Walk-in', tier: m?.tier ?? 'Guest', hours, pkg }))}>Start {hours}h session</Button></>}>
        <div className="flex flex-col gap-3"><Combobox label="Member (optional)" value={member} options={[{ value: '', label: 'Walk-in guest' }, ...memOpts]} onChange={setMember} /><NumberInput label="Hours" value={hours} min={1} max={12} onChange={setHours} /><Select label="Package" value={pkg} onChange={setPkg} options={['Hourly', 'Standard', 'VIP', 'Overnight', 'Unlimited', 'Tournament'].map(v => ({ value: v, label: v }))} /></div></Modal>
    case 'zone':
      return <Modal onClose={close} size="sm" title="Move to zone" footer={<><Button onClick={close}>Cancel</Button><Button v="primary" onClick={() => done(() => patch(l => { l.stations.filter(a => ids.includes(a.id)).forEach(a => { a.zone = zone }) }, true))}>Move</Button></>}><Select label="Zone" value={zone} onChange={setZone} options={layout.zones.map(z => ({ value: z.id, label: z.name }))} /></Modal>
    case 'rename': {
      const st = layout.stations.find(a => a.id === ids[0])
      return <Modal onClose={() => { close() }} title="Station configuration" footer={<><Button onClick={close}>Cancel</Button><Button v="primary" onClick={() => done(() => patch(l => { const s = l.stations.find(a => a.id === ids[0]); if (s) { if (name.trim()) s.name = name.trim(); s.type = type; if (zone !== '') s.zone = zone } }, true))}>Save</Button></>}>
        <div className="flex flex-col gap-3" onFocus={() => { if (!name && st) { setName(st.name); setType(st.type); setZone(st.zone) } }}><Input label="Station name" defaultValue={st?.name} value={name || st?.name || ''} onChange={e => setName(e.target.value)} data-autofocus />
          <Select label="Type" value={type || st?.type || 'standard'} onChange={v => setType(v as StationType)} options={[['standard', 'Standard PC'], ['dual', 'Dual-monitor PC'], ['vip', 'VIP PC'], ['console', 'Console Station'], ['table', 'Group Gaming Table'], ['stream', 'Streaming Station']].map(([value, label]) => ({ value, label }))} />
          <Select label="Zone" value={zone || st?.zone || ''} onChange={setZone} options={layout.zones.map(z => ({ value: z.id, label: z.name }))} /></div></Modal>
    }
  }
  return null
}

export function GlobalOverlays() {
  const menu = useStore(s => s.menu), set = useStore(s => s.set), layout = useStore(s => s.layout.stations)
  const title = menu ? (menu.ids.length > 1 ? `${menu.ids.length} stations` : layout.find(a => a.id === menu.ids[0])?.name) : ''
  return (
    <>
      <StationDrawer />
      {menu && <ContextMenu key={`${menu.x}-${menu.y}`} x={menu.x} y={menu.y} items={buildMenu(menu.ids, menu.edit)} onClose={() => set({ menu: null })} header={<div className="px-2.5 pt-1.5 pb-1 flex items-center justify-between gap-3"><span className="text-xs font-bold">{title}</span><span className="badge info !h-4 !text-[9px]">sim</span></div>} />}
      <Dialogs />
    </>
  )
}
