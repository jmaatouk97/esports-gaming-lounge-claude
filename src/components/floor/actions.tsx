import { Info, MonitorPlay, Cpu, Play, Clock, MinusCircle, UserPlus, Square, MonitorUp, Lock, Unlock, MessageSquare, LogOut, Power, RotateCw, PowerOff, ShoppingCart, ListOrdered, MapPin, Move, Pencil, X, Settings2, RotateCw as Rot, Copy, Trash2, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { MenuItem } from '../ui/overlays'
import type { CmdType } from '../../services/agent'

const DESTRUCTIVE: Partial<Record<CmdType, { title: string; verb: string }>> = {
  restart: { title: 'Restart', verb: 'restart' }, shutdown: { title: 'Shut down', verb: 'shut down' }, logout: { title: 'Force logout', verb: 'force-logout the user on' }, endSession: { title: 'End session', verb: 'end the session on' },
}
/** Runs a command, asking for glass confirmation first when it is destructive. */
export function runCmd(cmd: CmdType, ids: string[], payload?: Record<string, unknown>) {
  const s = useStore.getState(), d = DESTRUCTIVE[cmd]
  const names = ids.length > 1 ? `${ids.length} stations` : (s.layout.stations.find(a => a.id === ids[0])?.name ?? ids[0])
  if (d) s.confirm(`${d.title} ${names}?`, `This will ${d.verb} ${names}. Active players may lose unsaved progress.\n\nThe action is simulated in this demo — no real device is contacted.`, d.title, () => { s.run(cmd, ids, payload) })
  else s.run(cmd, ids, payload)
}
export const openDialog = (type: 'addTime' | 'removeTime' | 'message' | 'assign' | 'start' | 'zone' | 'rename', ids: string[]) => useStore.setState({ dialog: { type, ids } })
export const openDrawer = (id: string, tab = 'overview') => useStore.setState({ drawerId: id, drawerTab: tab })

export function buildMenu(ids: string[], edit: boolean): MenuItem[] {
  const s = useStore.getState(), multi = ids.length > 1, id = ids[0], l = s.live[id]
  const zones = s.layout.zones
  const zoneSub: MenuItem[] = [...zones.map(z => ({ label: z.name, icon: <MapPin size={13} />, onClick: () => { s.patchLayout(lay => { lay.stations.filter(a => ids.includes(a.id)).forEach(a => { a.zone = z.id }) }, true); s.toast({ title: `Moved ${ids.length} to ${z.name}`, level: 'ok' }) } })), { label: 'No zone', icon: <X size={13} />, onClick: () => s.patchLayout(lay => { lay.stations.filter(a => ids.includes(a.id)).forEach(a => { a.zone = '' }) }, true) }]
  if (edit) {
    return [
      { label: multi ? `${ids.length} objects selected` : s.layout.stations.find(a => a.id === id)?.name ?? 'Station', header: true },
      ...(!multi ? [{ label: 'Configure…', icon: <Settings2 size={14} />, onClick: () => openDialog('rename', ids) }, { label: 'Rename', icon: <Pencil size={14} />, onClick: () => openDialog('rename', ids) }] as MenuItem[] : []),
      { label: 'Move to Zone', icon: <MapPin size={14} />, children: zoneSub },
      { label: 'Rotate 90°', icon: <Rot size={14} />, onClick: () => s.patchLayout(lay => { lay.stations.filter(a => ids.includes(a.id)).forEach(a => { a.rot = (a.rot + 90) % 360 }) }, true) },
      { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => s.patchLayout(lay => { lay.stations.filter(a => ids.includes(a.id)).forEach((a, i) => { const n = Math.max(...lay.stations.map(x => parseInt(x.id.split('-')[1]) || 0)) + 1; lay.stations.push({ ...a, id: `pc-${String(n).padStart(2, '0')}`, name: `PC-${String(n).padStart(2, '0')}`, x: a.x + 20 + i, y: a.y + 20 }) }) }, true) },
      { label: 'Row · tight', icon: <Move size={14} />, disabled: !multi, onClick: () => s.arrange(ids, 'row', 6) },
      { label: 'Column · tight', icon: <Move size={14} />, disabled: !multi, onClick: () => s.arrange(ids, 'col', 6) },
      { sep: true },
      { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => { s.set({ selection: ids }); s.confirm(`Delete ${ids.length} station(s)?`, 'They will be removed from the floor layout. You can undo this from the toolbar.', 'Delete', () => useStore.getState().deleteSelected()) } },
    ]
  }
  if (multi) {
    return [
      { label: `${ids.length} stations selected`, header: true },
      { label: 'Lock Selected', icon: <Lock size={14} />, onClick: () => runCmd('lock', ids) }, { label: 'Unlock Selected', icon: <Unlock size={14} />, onClick: () => runCmd('unlock', ids) },
      { label: 'Restart Selected', icon: <RotateCw size={14} />, onClick: () => runCmd('restart', ids) }, { label: 'Shutdown Selected', icon: <PowerOff size={14} />, danger: true, onClick: () => runCmd('shutdown', ids) },
      { sep: true },
      { label: 'Send Message', icon: <MessageSquare size={14} />, onClick: () => openDialog('message', ids) }, { label: 'Wake on LAN', icon: <Zap size={14} />, onClick: () => runCmd('wol', ids) },
      { label: 'Move to Zone', icon: <MapPin size={14} />, children: zoneSub }, { sep: true },
      { label: 'Clear Selection', icon: <X size={14} />, onClick: () => s.clearSel() },
    ]
  }
  const off = l?.status === 'offline', use = l?.status === 'in-use'
  return [
    { label: 'Station Information', header: true },
    { label: 'View Station Details', icon: <Info size={14} />, onClick: () => openDrawer(id) },
    { label: 'View Live Screen', icon: <MonitorPlay size={14} />, disabled: off, onClick: () => { runCmd('screen', ids); openDrawer(id, 'remote') } },
    { label: 'Hardware Information', icon: <Cpu size={14} />, onClick: () => openDrawer(id, 'hardware') },
    { sep: true }, { label: 'Session Management', header: true },
    { label: 'Start Session', icon: <Play size={14} />, disabled: use || off, onClick: () => openDialog('start', ids) },
    { label: 'Add Time', icon: <Clock size={14} />, disabled: !use, onClick: () => openDialog('addTime', ids) },
    { label: 'Remove Time', icon: <MinusCircle size={14} />, disabled: !use, onClick: () => openDialog('removeTime', ids) },
    { label: 'Assign Member', icon: <UserPlus size={14} />, disabled: off, onClick: () => openDialog('assign', ids) },
    { label: 'End Session', icon: <Square size={14} />, danger: true, disabled: !use, onClick: () => runCmd('endSession', ids) },
    { sep: true }, { label: 'Remote Control', header: true },
    { label: 'Remote Desktop', icon: <MonitorUp size={14} />, disabled: off, onClick: () => { runCmd('rdp', ids); openDrawer(id, 'remote') } },
    { label: 'Lock', icon: <Lock size={14} />, disabled: off, onClick: () => runCmd('lock', ids) }, { label: 'Unlock', icon: <Unlock size={14} />, disabled: off, onClick: () => runCmd('unlock', ids) },
    { label: 'Send Message', icon: <MessageSquare size={14} />, disabled: off, onClick: () => openDialog('message', ids) },
    { label: 'Force Logout', icon: <LogOut size={14} />, danger: true, disabled: !use, onClick: () => runCmd('logout', ids) },
    { sep: true }, { label: 'Power Management', header: true },
    { label: 'Wake on LAN', icon: <Zap size={14} />, onClick: () => runCmd('wol', ids) }, { label: 'Restart', icon: <Power size={14} />, disabled: off, onClick: () => runCmd('restart', ids) }, { label: 'Shutdown', icon: <PowerOff size={14} />, danger: true, disabled: off, onClick: () => runCmd('shutdown', ids) },
    { sep: true }, { label: 'POS & Orders', header: true },
    { label: 'Order Food/Drinks', icon: <ShoppingCart size={14} />, onClick: () => { s.set({ cartPc: id, cafeMode: 'pos' }); s.toast({ title: `Cart assigned to ${id.toUpperCase()}`, body: 'Switched to POS & Cart', level: 'info' }) } },
    { label: `View Active Orders${l?.orders ? ` (${l.orders})` : ''}`, icon: <ListOrdered size={14} />, onClick: () => s.toast({ title: `${l?.orders ?? 0} active order(s) on ${id.toUpperCase()}`, level: 'info' }) },
    { sep: true }, { label: 'Organization', header: true },
    { label: 'Move to Zone', icon: <MapPin size={14} />, children: zoneSub },
    { label: 'Change Position', icon: <Move size={14} />, onClick: () => { s.set({ floorMode: 'edit', cafeMode: 'floor', selection: ids }); s.toast({ title: 'Edit Mode — drag the station to reposition', level: 'info' }) } },
    { label: 'Rename Station', icon: <Pencil size={14} />, onClick: () => openDialog('rename', ids) },
  ]
}

/** Opens the cursor-anchored context menu. Selection-aware. */
export function openStationMenu(e: { clientX: number; clientY: number; preventDefault: () => void; stopPropagation: () => void }, id: string, edit: boolean) {
  e.preventDefault(); e.stopPropagation()
  const s = useStore.getState()
  const ids = s.selection.includes(id) && s.selection.length > 1 ? s.selection.filter(x => s.layout.stations.some(a => a.id === x)) : [id]
  if (!s.selection.includes(id) && edit) useStore.setState({ selection: [id] })
  useStore.setState({ menu: { x: e.clientX, y: e.clientY, ids, edit, kind: 'station' } })
}
