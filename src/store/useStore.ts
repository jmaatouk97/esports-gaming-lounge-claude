import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FloorLayout, Layout, Live, Spec, Product, Member, Issue, Reservation, Tournament, Debt, Activity, Notice, StationType, Status, CartItem, Match } from './types'
import { DEFAULT_APPEARANCE, DEFAULT_OPTICS, type Appearance } from '../lib/presets'
import { defaultLayout, genLive, genSpec, PRODUCTS, MEMBERS, genIssues, RESERVATIONS, TOURNAMENTS, DEBTS, ACTIVITY } from '../services/mock'
import { agent, can, cmdLabel, type CmdType, type Role } from '../services/agent'
import { clamp, rnd, uid } from '../lib/utils'

export interface Toast { id: string; title: string; body?: string; level: 'info' | 'ok' | 'warn' | 'bad'; simulated?: boolean }
export type Density = 'compact' | 'standard' | 'detailed'
export type DialogKind = null | { type: 'confirm'; title: string; body: string; danger?: boolean; confirm: string; run: () => void }
  | { type: 'addTime' | 'removeTime' | 'message' | 'assign' | 'start' | 'zone' | 'rename'; ids: string[] }
export interface MenuState { x: number; y: number; ids: string[]; edit: boolean; kind: 'station' | 'zone' | 'canvas'; wx?: number; wy?: number }

const snap = (l: FloorLayout) => JSON.parse(JSON.stringify(l)) as FloorLayout
const freshLive = (lay: FloorLayout) => Object.fromEntries(lay.stations.map((s, i) => [s.id, genLive(s, i)]))
const freshSpecs = (lay: FloorLayout) => Object.fromEntries(lay.stations.map((s, i) => [s.id, genSpec(s, i)]))
const SIZES: Record<StationType, [number, number]> = { standard: [56, 44], dual: [72, 44], vip: [70, 52], console: [76, 52], table: [130, 70], stream: [76, 52] }

export interface PricingCfg { main: number; vip: number; console: number; peak: number; offpeak: number; overnight: number; happyHour: number; happyStart: number; happyEnd: number; memberDisc: number[] }
export interface SettingsCfg { lockBrand: string; lockTagline: string; idleMin: number; tax: number; taxIncl: boolean; receiptHeader: string; receiptFooter: string; receiptLogo: boolean }
export interface Shift { open: boolean; employee: string; startedAt: number; float: number; cash: number; card: number; topups: number; closed: { at: number; counted: number }[] }

interface State {
  appearance: Appearance; role: Role; sidebarCollapsed: boolean
  layout: FloorLayout; past: FloorLayout[]; future: FloorLayout[]; dirty: boolean; savedAt: number | null
  live: Record<string, Live>; specs: Record<string, Spec>
  selection: string[]; drawerId: string | null; drawerTab: string; menu: MenuState | null; dialog: DialogKind
  density: Density; thumbMode: boolean; thumbInterval: number; thumbPaused: boolean
  toasts: Toast[]; notices: Notice[]
  cart: CartItem[]; cartPc: string; cartMember: string; cartDiscount: number; cartPay: 'Cash' | 'Card' | 'Member Balance' | 'PC Tab'; cartSent: boolean; orderNo: number
  products: Product[]; members: Member[]; issues: Issue[]; reservations: Reservation[]; tournaments: Tournament[]; debts: Debt[]; activity: Activity[]
  pricing: PricingCfg; settings: SettingsCfg; shift: Shift; wastage: { sku: string; qty: number; reason: string; at: number }[]
  cafeMode: 'pos' | 'floor'; floorMode: 'live' | 'edit'; commandOpen: boolean; studioOpen: boolean; notifOpen: boolean; revenue: { pc: number; cafe: number; orders: number }

  set: (p: Partial<State>) => void
  setAppearance: (p: Partial<Appearance>) => void
  toast: (t: Omit<Toast, 'id'>) => void; dismissToast: (id: string) => void
  notify: (n: Omit<Notice, 'id' | 't' | 'read'>) => void
  logActivity: (kind: Activity['kind'], text: string) => void
  tick: (n: number) => void
  // selection
  select: (ids: string[], additive?: boolean) => void; toggleSel: (id: string) => void; clearSel: () => void
  // layout
  commit: () => void; undo: () => void; redo: () => void
  patchLayout: (fn: (l: FloorLayout) => void, record?: boolean) => void
  addStation: (type: StationType, x: number, y: number) => void
  addZone: (x: number, y: number) => void; addFurniture: (kind: FloorLayout['furniture'][number]['kind'], x: number, y: number) => void; addLabel: (x: number, y: number) => void
  deleteSelected: () => void; saveLayout: () => void; resetLayout: () => void
  arrange: (ids: string[], dir: 'row' | 'col', gap: number) => void
  assignZoneByPosition: (ids: string[]) => void
  // commands
  run: (cmd: CmdType, ids: string[], payload?: Record<string, unknown>) => Promise<void>
  confirm: (title: string, body: string, confirm: string, run: () => void, danger?: boolean) => void
  // POS
  addToCart: (sku: string) => void; setQty: (sku: string, d: number) => void; clearCart: () => void; checkout: (send?: boolean) => boolean
  // misc domain
  restock: (sku: string, qty: number) => void; adjustStock: (sku: string, d: number) => void
  logWaste: (sku: string, qty: number, reason: string) => void
  topUp: (memberId: string, amt: number) => void
  resolveIssue: (id: string) => void
  setScore: (tid: string, mid: string, sa: number, sb: number) => void
}

const advance = (t: Tournament): Tournament => {
  const ms: Match[] = t.matches.map(m => ({ ...m }))
  const get = (id: string) => ms.find(m => m.id === id)
  const fill = (id: string, slot: 'a' | 'b', v: string | null) => { const m = get(id); if (m) m[slot] = v }
  const loser = (m: Match) => (m.winner ? (m.winner === m.a ? m.b : m.a) : null)
  for (const m of ms.filter(x => x.bracket === 'W')) {
    if (m.round === 1) { const nx = `W2-${Math.floor(m.idx / 2)}`; fill(nx, m.idx % 2 ? 'b' : 'a', m.winner); if (t.format === 'double') fill(`L1-${Math.floor(m.idx / 2)}`, m.idx % 2 ? 'b' : 'a', loser(m)) }
    if (m.round === 2) { fill('W3-0', m.idx ? 'b' : 'a', m.winner); if (t.format === 'double') fill('L2-0', m.idx ? 'b' : 'a', loser(m)) }
    if (m.round === 3 && t.format === 'double') fill('GF-0', 'a', m.winner)
  }
  if (t.format === 'double') {
    for (const m of ms.filter(x => x.bracket === 'L' && x.round === 1)) fill('L2-0', m.idx ? 'b' : 'a', m.winner)
    const l2 = get('L2-0'); if (l2) fill('GF-0', 'b', l2.winner)
  }
  // clear dependents' winners that no longer match participants
  for (const m of ms) if (m.winner && m.winner !== m.a && m.winner !== m.b) { m.winner = null; m.sa = 0; m.sb = 0 }
  return { ...t, matches: ms }
}

const baseLayout = defaultLayout()

export const useStore = create<State>()(persist((set, get) => ({
  appearance: DEFAULT_APPEARANCE, role: 'Admin', sidebarCollapsed: false,
  layout: baseLayout, past: [], future: [], dirty: false, savedAt: null,
  live: freshLive(baseLayout), specs: freshSpecs(baseLayout),
  selection: [], drawerId: null, drawerTab: 'overview', menu: null, dialog: null,
  density: 'compact', thumbMode: false, thumbInterval: 5, thumbPaused: false,
  toasts: [], notices: [
    { id: 'n1', t: Date.now() - 300000, title: 'GPU 93°C on PC-31', body: 'Thermal alert — simulated telemetry', level: 'bad', read: false },
    { id: 'n2', t: Date.now() - 900000, title: 'Low stock: Cola 330ml', body: '8 units left (reorder at 24)', level: 'warn', read: false },
    { id: 'n3', t: Date.now() - 3600000, title: 'Reservation checked in', body: 'Birthday · Lina — VIP Room', level: 'ok', read: true },
  ],
  cart: [], cartPc: '', cartMember: '', cartDiscount: 0, cartPay: 'Cash', cartSent: false, orderNo: 1043,
  products: PRODUCTS, members: MEMBERS, issues: genIssues(baseLayout.stations), reservations: RESERVATIONS, tournaments: TOURNAMENTS, debts: DEBTS, activity: ACTIVITY,
  pricing: { main: 3, vip: 6, console: 5, peak: 20, offpeak: -15, overnight: 12, happyHour: -25, happyStart: 14, happyEnd: 17, memberDisc: [0, 5, 10, 15] },
  settings: { lockBrand: 'Esports Gaming Lounge', lockTagline: 'Insert coin. Play loud.', idleMin: 20, tax: 11, taxIncl: false, receiptHeader: 'ESPORTS GAMING LOUNGE\n12 Arcade St.', receiptFooter: 'Thanks for playing — GG!', receiptLogo: true },
  shift: { open: true, employee: 'Hadi K.', startedAt: Date.now() - 4 * 3600000, float: 200, cash: 486.5, card: 712.25, topups: 140, closed: [] },
  wastage: [], cafeMode: 'pos', floorMode: 'live', commandOpen: false, studioOpen: false, notifOpen: false, revenue: { pc: 1840, cafe: 624.5, orders: 58 },

  set: p => set(p),
  setAppearance: p => set(s => ({ appearance: { ...s.appearance, ...p } })),
  toast: t => { const id = uid(); set(s => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] })); setTimeout(() => get().dismissToast(id), t.level === 'bad' ? 6000 : 3800) },
  dismissToast: id => set(s => ({ toasts: s.toasts.filter(x => x.id !== id) })),
  notify: n => set(s => ({ notices: [{ ...n, id: uid(), t: Date.now(), read: false }, ...s.notices].slice(0, 40) })),
  logActivity: (kind, text) => set(s => ({ activity: [{ id: uid(), t: Date.now(), kind, text }, ...s.activity].slice(0, 40) })),

  tick: n => set(s => {
    const live: Record<string, Live> = {}
    const tel = n % 3 === 0
    for (const id in s.live) {
      const l = s.live[id]
      if (l.status === 'in-use' || l.status === 'available' || l.status === 'locked' || l.status === 'reserved') {
        let u: Live = l
        if (l.status === 'in-use' && l.pkg !== 'Unlimited' && l.remaining > 0) u = { ...u, remaining: l.remaining - 1 }
        if (l.status === 'in-use' && l.remaining <= 0 && l.pkg !== 'Unlimited') u = { ...u, status: 'locked', user: null, tier: null, pkg: null, game: 'Lock Screen', proc: 'explorer.exe', procStatus: 'Idle', fps: 0, cpu: 4, gpu: 2 }
        if (tel && u.status === 'in-use') {
          const j = (v: number, d: number, a = 1, b = 100) => clamp(v + rnd(-d, d), a, b)
          const cpu = j(u.cpu, 7), gpu = j(u.gpu, 7), ping = j(u.ping, 4, 3, 140)
          u = { ...u, cpu, gpu, cpuT: j(u.cpuT, 2, 40, 99), gpuT: j(u.gpuT, 2, 40, 99), ram: j(u.ram, 1.5), ping, loss: ping > 60 ? j(u.loss, .6, .5, 6) : Math.max(0, u.loss - .1), fps: Math.round(j(u.fps, 14, 40, 340)), sCpu: [...u.sCpu.slice(1), cpu], sGpu: [...u.sGpu.slice(1), gpu], sPing: [...u.sPing.slice(1), ping] }
        }
        live[id] = u
      } else live[id] = l
    }
    return { live }
  }),

  select: (ids, additive) => set(s => ({ selection: additive ? Array.from(new Set([...s.selection, ...ids])) : ids })),
  toggleSel: id => set(s => ({ selection: s.selection.includes(id) ? s.selection.filter(x => x !== id) : [...s.selection, id] })),
  clearSel: () => set({ selection: [] }),

  commit: () => set(s => ({ past: [...s.past.slice(-49), snap(s.layout)], future: [], dirty: true })),
  undo: () => set(s => { if (!s.past.length) return s; const prev = s.past[s.past.length - 1]; return { past: s.past.slice(0, -1), future: [snap(s.layout), ...s.future], layout: prev, dirty: true } }),
  redo: () => set(s => { if (!s.future.length) return s; const nx = s.future[0]; return { future: s.future.slice(1), past: [...s.past, snap(s.layout)], layout: nx, dirty: true } }),
  patchLayout: (fn, record) => { if (record) get().commit(); set(s => { const l = snap(s.layout); fn(l); return { layout: l, dirty: true } }) },

  addStation: (type, x, y) => {
    const s = get(); s.commit()
    const nums = s.layout.stations.map(a => parseInt(a.id.split('-')[1]) || 0), n = Math.max(0, ...nums) + 1
    const [w, h] = SIZES[type]
    const st: Layout = { id: `pc-${String(n).padStart(2, '0')}`, name: type === 'console' ? `CON-${n}` : `PC-${String(n).padStart(2, '0')}`, type, x, y, w, h, rot: 0, zone: '' }
    const l = snap(s.layout); l.stations.push(st)
    const z = l.zones.find(z => x + w / 2 >= z.x && x + w / 2 <= z.x + z.w && y + h / 2 >= z.y && y + h / 2 <= z.y + z.h); st.zone = z?.id ?? ''
    set({ layout: l, dirty: true, live: { ...s.live, [st.id]: { ...genLive(st, n), status: 'available', user: null, tier: null, pkg: null, remaining: 0, cost: 0, game: 'Desktop Idle', proc: 'explorer.exe', procStatus: 'Idle', fps: 0, startedAt: null } }, specs: { ...s.specs, [st.id]: genSpec(st, n) }, selection: [st.id] })
    get().toast({ title: `Added ${st.name}`, level: 'ok' })
  },
  addZone: (x, y) => { get().patchLayout(l => { l.zones.push({ id: 'z-' + uid(), name: 'New Zone', x, y, w: 320, h: 200, hue: '#8B5CF6' }) }, true) },
  addFurniture: (kind, x, y) => { get().patchLayout(l => { l.furniture.push({ id: 'f-' + uid(), kind, x, y, w: kind === 'plant' ? 30 : 120, h: kind === 'plant' ? 30 : 44, rot: 0 }) }, true) },
  addLabel: (x, y) => { get().patchLayout(l => { l.labels.push({ id: 'l-' + uid(), text: 'Label', x, y }) }, true) },
  deleteSelected: () => {
    const sel = get().selection; if (!sel.length) return
    get().patchLayout(l => { l.stations = l.stations.filter(a => !sel.includes(a.id)); l.zones = l.zones.filter(a => !sel.includes(a.id)); l.furniture = l.furniture.filter(a => !sel.includes(a.id)); l.labels = l.labels.filter(a => !sel.includes(a.id)); l.stations.forEach(st => { if (sel.includes(st.zone)) st.zone = '' }) }, true)
    set({ selection: [], drawerId: null }); get().toast({ title: `Deleted ${sel.length} object(s)`, level: 'info' })
  },
  saveLayout: () => { set({ dirty: false, savedAt: Date.now() }); get().toast({ title: 'Layout saved', body: 'Stored locally (mock persistence — no backend connected)', level: 'ok', simulated: true }) },
  resetLayout: () => { const l = defaultLayout(); get().commit(); set({ layout: l, live: freshLive(l), specs: freshSpecs(l), selection: [], dirty: true }); get().toast({ title: 'Layout reset to default', level: 'info' }) },
  arrange: (ids, dir, gap) => get().patchLayout(l => {
    const st = l.stations.filter(a => ids.includes(a.id)).sort((a, b) => dir === 'row' ? a.x - b.x : a.y - b.y); if (st.length < 2) return
    let cur = dir === 'row' ? st[0].x : st[0].y; const base = st[0]
    st.forEach(a => { if (dir === 'row') { a.x = cur; a.y = base.y; cur += a.w + gap } else { a.y = cur; a.x = base.x; cur += a.h + gap } })
  }, true),
  assignZoneByPosition: ids => get().patchLayout(l => { l.stations.filter(a => ids.includes(a.id)).forEach(a => { const cx = a.x + a.w / 2, cy = a.y + a.h / 2; a.zone = l.zones.find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h)?.id ?? '' }) }),

  confirm: (title, body, confirm, run, danger = true) => set({ dialog: { type: 'confirm', title, body, confirm, run, danger } }),
  run: async (cmd, ids, payload) => {
    const s = get()
    if (!can(s.role, cmd)) { s.toast({ title: 'Permission denied', body: `${s.role} cannot ${cmdLabel(cmd).toLowerCase()}`, level: 'bad' }); return }
    const res = await agent.send({ type: cmd, stationIds: ids, payload, issuedBy: s.role }, s.role)
    if (!res.ok) { get().toast({ title: 'Command rejected', body: res.message, level: 'bad' }); return }
    const names = (id: string) => s.layout.stations.find(a => a.id === id)?.name ?? id
    set(st => {
      const live = { ...st.live }
      for (const id of ids) {
        const l = live[id]; if (!l) continue
        const ev = (kind: Live['history'][number]['kind'], text: string) => [...l.history, { t: Date.now(), kind, text }]
        const mins = Number(payload?.minutes ?? 0)
        switch (cmd) {
          case 'lock': live[id] = { ...l, status: l.status === 'in-use' ? 'in-use' : 'locked', history: ev('remote', 'Locked by operator') }; if (l.status === 'in-use') live[id] = { ...l, status: 'locked', history: ev('remote', 'Locked by operator (session paused)') }; break
          case 'unlock': live[id] = { ...l, status: l.user ? 'in-use' : 'available', history: ev('remote', 'Unlocked by operator') }; break
          case 'restart': live[id] = { ...l, history: ev('power', 'Restart issued'), game: 'Windows Desktop', proc: 'explorer.exe', procStatus: 'Rebooting', fps: 0 }; break
          case 'shutdown': live[id] = { ...l, status: 'offline', user: null, tier: null, pkg: null, remaining: 0, game: '—', proc: '—', procStatus: 'Agent offline', cpu: 0, gpu: 0, fps: 0, ping: 0, agent: 'disconnected', history: ev('power', 'Shutdown issued') }; break
          case 'wol': live[id] = l.status === 'offline' ? { ...l, status: 'available', game: 'Windows Desktop', proc: 'explorer.exe', procStatus: 'Idle', agent: 'v2.4.1 (simulated)', ping: 9, cpu: 5, history: ev('power', 'Wake on LAN sent — PC powered on') } : { ...l, history: ev('power', 'Wake on LAN packet sent') }; break
          case 'logout': live[id] = { ...l, status: 'available', user: null, tier: null, pkg: null, remaining: 0, game: 'Desktop Idle', proc: 'explorer.exe', procStatus: 'Idle', fps: 0, history: ev('logout', `${l.user ?? 'User'} force logged out`) }; break
          case 'endSession': live[id] = { ...l, status: 'available', user: null, tier: null, pkg: null, remaining: 0, game: 'Desktop Idle', proc: 'explorer.exe', procStatus: 'Idle', fps: 0, history: ev('logout', 'Session ended by operator') }; break
          case 'addTime': live[id] = { ...l, remaining: l.remaining + mins * 60, cost: +(l.cost + mins * .05).toFixed(2), history: ev('time', `+${mins} min added`) }; break
          case 'removeTime': live[id] = { ...l, remaining: Math.max(0, l.remaining - mins * 60), history: ev('time', `−${mins} min removed`) }; break
          case 'startSession': { const m = String(payload?.user ?? 'Walk-in'); const h = Number(payload?.hours ?? 1); live[id] = { ...l, status: 'in-use', user: m, tier: (payload?.tier as Live['tier']) ?? 'Guest', pkg: String(payload?.pkg ?? 'Hourly'), startedAt: Date.now(), remaining: h * 3600, cost: +(h * 3).toFixed(2), game: 'Windows Desktop', proc: 'explorer.exe', procStatus: 'Running', history: [...l.history, { t: Date.now(), kind: 'login', text: `${m} logged in` }, { t: Date.now(), kind: 'session', text: `Session started · ${h}h` }] }; break }
          case 'assignMember': live[id] = { ...l, user: String(payload?.user ?? l.user), tier: (payload?.tier as Live['tier']) ?? l.tier, history: ev('login', `Member ${payload?.user} assigned`) }; break
          case 'message': live[id] = { ...l, history: ev('remote', `Message sent: “${payload?.text}”`) }; break
          default: live[id] = { ...l, history: ev('remote', `${cmdLabel(cmd)} requested`) }
        }
      }
      return { live }
    })
    const who = ids.length > 1 ? `${ids.length} stations` : names(ids[0])
    get().toast({ title: `${cmdLabel(cmd)} · ${who}`, body: 'Simulated response — no real device contacted', level: 'ok', simulated: true })
    if (['restart', 'shutdown', 'logout', 'endSession'].includes(cmd)) get().logActivity('session', `${cmdLabel(cmd)} on ${who} (simulated)`)
  },

  addToCart: sku => set(s => { const e = s.cart.find(c => c.sku === sku); return { cartSent: false, cart: e ? s.cart.map(c => c.sku === sku ? { ...c, qty: c.qty + 1 } : c) : [...s.cart, { sku, qty: 1 }] } }),
  setQty: (sku, d) => set(s => ({ cart: s.cart.map(c => c.sku === sku ? { ...c, qty: c.qty + d } : c).filter(c => c.qty > 0) })),
  clearCart: () => set({ cart: [], cartDiscount: 0, cartSent: false }),
  checkout: send => {
    const s = get(); if (!s.cart.length) { s.toast({ title: 'Cart is empty', level: 'warn' }); return false }
    const sub = s.cart.reduce((a, c) => a + (s.products.find(p => p.sku === c.sku)?.price ?? 0) * c.qty, 0)
    const total = (sub * (1 - s.cartDiscount / 100)) * (1 + (s.settings.taxIncl ? 0 : s.settings.tax / 100))
    const mem = s.members.find(m => m.id === s.cartMember)
    if (!send) {
      if (s.cartPay === 'Member Balance') { if (!mem) { s.toast({ title: 'Select a member', body: 'Member Balance needs a member', level: 'warn' }); return false } if (mem.wallet < total) { s.toast({ title: 'Insufficient balance', body: `${mem.user} has $${mem.wallet.toFixed(2)}`, level: 'bad' }); return false } }
      if (s.cartPay === 'PC Tab' && !s.cartPc) { s.toast({ title: 'Select a PC', body: 'Charge to PC Tab needs a station', level: 'warn' }); return false }
    } else if (!s.cartPc) { s.toast({ title: 'Select a PC to send the order to', level: 'warn' }); return false }
    const isPkg = (sku: string) => s.products.find(p => p.sku === sku)?.cat === 'Gaming Packages'
    set(st => ({
      products: st.products.map(p => { const c = st.cart.find(c => c.sku === p.sku); return c && p.cat !== 'Gaming Packages' ? { ...p, stock: Math.max(0, p.stock - c.qty) } : p }),
      members: st.members.map(m => m.id === st.cartMember && !send && st.cartPay === 'Member Balance' ? { ...m, wallet: +(m.wallet - total).toFixed(2) } : m),
      debts: !send && st.cartPay === 'PC Tab' ? [{ id: uid(), kind: 'Customer Tab', who: `${st.cartPc} tab`, amount: +total.toFixed(2), due: new Date().toISOString().slice(0, 10), settled: false }, ...st.debts] : st.debts,
      shift: !send ? { ...st.shift, cash: st.cartPay === 'Cash' ? st.shift.cash + total : st.shift.cash, card: st.cartPay === 'Card' ? st.shift.card + total : st.shift.card } : st.shift,
      revenue: !send ? { ...st.revenue, cafe: st.revenue.cafe + total, orders: st.revenue.orders + 1 } : st.revenue,
      orderNo: st.orderNo + 1, cart: [], cartDiscount: 0, cartSent: false,
      live: st.cartPc ? { ...st.live, [st.cartPc]: { ...st.live[st.cartPc], orders: st.live[st.cartPc].orders + 1, history: [...st.live[st.cartPc].history, { t: Date.now(), kind: 'order', text: `Cafe order #${st.orderNo} placed` }] } } : st.live,
    }))
    const hasPkg = s.cart.some(c => isPkg(c.sku))
    get().logActivity(send ? 'order' : 'payment', `Order #${s.orderNo} ${send ? 'sent to' : 'paid'} ${s.cartPc || 'walk-in'} · $${total.toFixed(2)}${send ? '' : ' · ' + s.cartPay}${hasPkg ? ' · package' : ''}`)
    s.toast({ title: send ? `Order #${s.orderNo} sent to ${s.cartPc}` : `Paid ${'$' + total.toFixed(2)} · ${s.cartPay}`, body: 'Recorded in local demo data', level: 'ok' })
    return true
  },

  restock: (sku, qty) => { set(s => ({ products: s.products.map(p => p.sku === sku ? { ...p, stock: p.stock + qty } : p) })); get().toast({ title: `Restocked ${sku} +${qty}`, level: 'ok' }) },
  adjustStock: (sku, d) => set(s => ({ products: s.products.map(p => p.sku === sku ? { ...p, stock: Math.max(0, p.stock + d) } : p) })),
  logWaste: (sku, qty, reason) => { set(s => ({ wastage: [{ sku, qty, reason, at: Date.now() }, ...s.wastage], products: s.products.map(p => p.sku === sku ? { ...p, stock: Math.max(0, p.stock - qty) } : p) })); get().toast({ title: `Wastage logged: ${sku} −${qty}`, body: reason, level: 'warn' }) },
  topUp: (id, amt) => { set(s => ({ members: s.members.map(m => m.id === id ? { ...m, wallet: +(m.wallet + amt).toFixed(2) } : m), shift: { ...s.shift, topups: s.shift.topups + amt, cash: s.shift.cash + amt } })); get().logActivity('payment', `Top-up $${amt.toFixed(2)}`); get().toast({ title: `Topped up $${amt.toFixed(2)}`, level: 'ok' }) },
  resolveIssue: id => set(s => ({ issues: s.issues.map(i => i.id === id ? { ...i, resolved: true } : i) })),
  setScore: (tid, mid, sa, sb) => set(s => ({
    tournaments: s.tournaments.map(t => {
      if (t.id !== tid) return t
      const ms = t.matches.map(m => m.id === mid ? { ...m, sa, sb, winner: sa === sb ? null : sa > sb ? m.a : m.b } : m)
      return advance({ ...t, matches: ms })
    }),
  })),
}), {
  name: 'esl-claude-v1', version: 1,
  partialize: s => ({ appearance: s.appearance, layout: s.layout, products: s.products, members: s.members, reservations: s.reservations, tournaments: s.tournaments, debts: s.debts, pricing: s.pricing, settings: s.settings, shift: s.shift, density: s.density, sidebarCollapsed: s.sidebarCollapsed, savedAt: s.savedAt }),
  merge: (p, cur) => {
    const m = { ...cur, ...(p as object) } as State
    // rebuild live/spec for any persisted layout
    m.live = freshLive(m.layout); m.specs = freshSpecs(m.layout)
    m.issues = genIssues(m.layout.stations)
    return m
  },
}))

export const OPT_DEFAULT = DEFAULT_OPTICS
export const statusColor: Record<Status, string> = { available: '#34d399', 'in-use': '#60a5fa', locked: '#fbbf24', offline: '#94a3b8', reserved: '#c084fc', maintenance: '#f87171' }
export const statusLabel: Record<Status, string> = { available: 'READY', 'in-use': 'IN USE', locked: 'LOCKED', offline: 'OFFLINE', reserved: 'RESERVED', maintenance: 'MAINT.' }
