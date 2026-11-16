import type { FloorLayout, Layout, Live, Spec, Product, Member, Issue, Reservation, Tournament, Match, Debt, Activity, Status, Tier, StationType } from '../store/types'
import { mulberry, uid } from '../lib/utils'

export const GAMES = [
  ['Valorant', 'VALORANT-Win64-Shipping.exe', '🎯'], ['Counter-Strike 2', 'cs2.exe', '🔫'], ['Dota 2', 'dota2.exe', '🛡️'],
  ['League of Legends', 'LeagueClient.exe', '⚔️'], ['Fortnite', 'FortniteClient.exe', '🪂'], ['Apex Legends', 'r5apex.exe', '🦅'],
  ['Rocket League', 'RocketLeague.exe', '🚗'], ['EA FC 25', 'FC25.exe', '⚽'],
] as const
export const gameIcon = (g: string) => GAMES.find(x => x[0] === g)?.[2] ?? (g === 'Desktop Idle' ? '🖥️' : '🪟')

const ZONES = [
  { id: 'z-main', name: 'Main Hall', x: 40, y: 60, w: 780, h: 480, hue: '#6F9DFF' },
  { id: 'z-arena', name: 'Esports Arena', x: 860, y: 60, w: 520, h: 300, hue: '#F43F5E' },
  { id: 'z-vip', name: 'VIP Room', x: 860, y: 390, w: 520, h: 230, hue: '#D946EF' },
  { id: 'z-con', name: 'Console Zone', x: 40, y: 580, w: 520, h: 210, hue: '#10B981' },
  { id: 'z-stream', name: 'Streaming Booths', x: 600, y: 650, w: 330, h: 140, hue: '#F59E0B' },
  { id: 'z-priv', name: 'Private Rooms', x: 970, y: 650, w: 410, h: 140, hue: '#22D3EE' },
]
const SIZE: Record<StationType, [number, number]> = { standard: [56, 44], dual: [72, 44], vip: [70, 52], console: [76, 52], table: [130, 70], stream: [76, 52] }

export function defaultLayout(): FloorLayout {
  const st: Layout[] = []
  let n = 1
  const add = (type: StationType, x: number, y: number, zone: string, name?: string, rot = 0) => {
    const [w, h] = SIZE[type]
    st.push({ id: `pc-${String(n).padStart(2, '0')}`, name: name ?? `PC-${String(n).padStart(2, '0')}`, type, x, y, w, h, rot, zone }); n++
  }
  // Main hall: 3 rows of 10 -> 30 (two blocks of 5 per row)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
    if (r === 3 && c > 9) continue
    add('standard', 70 + c * 72 + (c >= 5 ? 40 : 0), 110 + r * 100, 'z-main')
  }
  // Arena: 2 rows x 5 dual
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) add('dual', 885 + c * 96, 115 + r * 105, 'z-arena')
  // VIP: 6
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) add('vip', 890 + c * 120, 440 + r * 85, 'z-vip')
  // Console
  for (let c = 0; c < 4; c++) add('console', 70 + c * 120, 650, 'z-con', `CON-${c + 1}`)
  // stream
  for (let c = 0; c < 2; c++) add('stream', 630 + c * 140, 700, 'z-stream', `STR-${c + 1}`)
  // private: group tables
  for (let c = 0; c < 2; c++) add('table', 1000 + c * 190, 700, 'z-priv', `TBL-${c + 1}`)
  return {
    stations: st, zones: ZONES,
    furniture: [
      { id: 'f1', kind: 'counter', x: 600, y: 580, w: 200, h: 44, rot: 0 }, { id: 'f2', kind: 'sofa', x: 1220, y: 586, w: 140, h: 28, rot: 0 },
      { id: 'f3', kind: 'plant', x: 24, y: 24, w: 30, h: 30, rot: 0 }, { id: 'f4', kind: 'plant', x: 1340, y: 24, w: 30, h: 30, rot: 0 },
    ],
    labels: [{ id: 'l1', text: 'ENTRANCE ▼', x: 380, y: 20 }, { id: 'l2', text: 'Café Counter', x: 640, y: 560 }],
  }
}

const NAMES = ['Zed', 'Nova', 'Kairo', 'Lyra', 'Orion', 'Mika', 'Dax', 'Rin', 'Sol', 'Vex', 'Juno', 'Axel', 'Tali', 'Bram', 'Echo', 'Fenn', 'Gale', 'Hux', 'Ivo', 'Kade', 'Luma', 'Nyx', 'Odin', 'Pax', 'Quill', 'Rex', 'Sage', 'Tarn']
const PKG = ['Hourly', 'Standard', 'VIP', 'Overnight', 'Unlimited', 'Tournament']
const TIERS: Tier[] = ['Guest', 'Standard', 'VIP', 'Esports Pro']

export function genLive(l: Layout, i: number): Live {
  const r = mulberry(i * 7919 + 13), now = Date.now()
  const roll = r()
  let status: Status = roll < .62 ? 'in-use' : roll < .78 ? 'available' : roll < .86 ? 'locked' : roll < .91 ? 'reserved' : roll < .96 ? 'offline' : 'maintenance'
  if (l.type === 'table') status = i % 2 ? 'in-use' : 'reserved'
  const act = status === 'in-use'
  const g = GAMES[Math.floor(r() * GAMES.length)]
  const hot = r() < .08
  const base = (a: number, b: number) => a + r() * (b - a)
  const mk = (v: number, n = 24, j = 8) => Array.from({ length: n }, () => Math.max(2, v + (r() - .5) * j * 2))
  const cpu = act ? base(25, 88) : status === 'offline' ? 0 : base(2, 9), gpu = act ? base(30, 97) : status === 'offline' ? 0 : base(1, 6)
  const ping = status === 'offline' ? 0 : base(6, hot ? 90 : 34)
  const user = act ? NAMES[(i * 5) % NAMES.length] + (10 + ((i * 17) % 89)) : null
  const tier = act ? TIERS[Math.floor(r() * 4)] : null
  const started = act ? now - Math.floor(base(5, 140)) * 60000 : null
  const hist: Live['history'] = [{ t: (started ?? now) - 600000, kind: 'power', text: 'PC powered on (Wake on LAN)' }]
  if (act) hist.push({ t: started! - 20000, kind: 'login', text: `${user} logged in` }, { t: started!, kind: 'session', text: `Session started · ${PKG[i % PKG.length]}` })
  return {
    id: l.id, status, user, tier, pkg: act ? PKG[i % PKG.length] : null, startedAt: started,
    remaining: act ? Math.floor(base(300, 9000)) : status === 'reserved' ? 1800 : 0, cost: act ? +(base(2, 18)).toFixed(2) : 0,
    game: act ? g[0] : status === 'offline' ? '—' : status === 'locked' ? 'Lock Screen' : 'Desktop Idle', proc: act ? g[1] : status === 'offline' ? '—' : 'explorer.exe',
    procStatus: act ? (r() < .95 ? 'Running' : 'Not responding') : status === 'offline' ? 'Agent offline' : 'Idle',
    cpu, gpu, cpuT: act ? base(52, hot ? 95 : 78) : status === 'offline' ? 0 : base(34, 44), gpuT: act ? base(55, hot ? 94 : 80) : status === 'offline' ? 0 : base(32, 42),
    ram: act ? base(40, 85) : status === 'offline' ? 0 : base(18, 30), disk: base(30, i % 13 === 0 ? 92 : 70), ping, loss: ping > 60 ? base(1, 4) : r() < .1 ? base(.2, 1) : 0, fps: act && l.type !== 'console' ? Math.round(base(70, 260)) : 0,
    sCpu: mk(cpu), sPing: mk(ping, 24, 5), sGpu: mk(gpu), agent: status === 'offline' ? 'disconnected' : 'v2.4.1 (simulated)', history: hist, orders: act ? Math.floor(r() * 3) : 0, simulated: true,
  }
}

const CPUS = ['Ryzen 5 7600X', 'Core i5-13600K', 'Ryzen 7 7800X3D', 'Core i7-14700K'], GPUS = ['RTX 4060', 'RTX 4070 Super', 'RTX 4070 Ti', 'RTX 4080 Super', 'RX 7800 XT']
export function genSpec(l: Layout, i: number): Spec {
  const r = mulberry(i * 31 + 5), pk = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const vip = l.type === 'vip' || l.type === 'dual'
  const con = l.type === 'console'
  return {
    cpu: con ? 'AMD Zen 2 (8-core)' : vip ? pk(CPUS.slice(2)) : pk(CPUS), gpu: con ? 'RDNA 2 (10.3 TFLOPs)' : vip ? pk(GPUS.slice(2)) : pk(GPUS), ram: vip ? '32 GB DDR5-6000' : '16 GB DDR5-5600',
    storage: con ? '825 GB NVMe' : vip ? '2 TB NVMe Gen4' : '1 TB NVMe', board: pk(['ASUS TUF B650-PLUS', 'MSI MAG B760 Tomahawk', 'Gigabyte B650 AORUS Elite']),
    monitor: vip ? 'ASUS ROG Swift PG27AQN' : pk(['AOC 24G2', 'BenQ ZOWIE XL2546K', 'LG 27GP850']), hz: vip ? 360 : pk([144, 165, 240]), os: 'Windows 11 Pro 23H2 (22631.' + (4000 + i * 3) + ')',
    serial: 'KB-' + (100000 + i * 137) + ' / MS-' + (200000 + i * 211),
    games: GAMES.slice(0, 6).map((g, k) => ({ n: g[0], patch: (i + k) % 11 === 0 ? 'outdated' as const : (i + k) % 17 === 0 ? 'updating' as const : 'current' as const })),
  }
}

export const PRODUCTS: Product[] = [
  ['PKG-1H', '1 Hour Pass', 'Gaming Packages', 1.5, 4, 999, 4, '⏱️', 215], ['PKG-3H', '3 Hour Pass', 'Gaming Packages', 4, 10, 999, 4, '🎮', 235], ['PKG-5H', '5 Hour Pass', 'Gaming Packages', 6, 15, 999, 4, '🕹️', 255],
  ['PKG-NT', 'All-Night Pass', 'Gaming Packages', 10, 25, 999, 4, '🌙', 270], ['PKG-VIP', 'VIP 2 Hour', 'Gaming Packages', 5, 14, 999, 4, '👑', 300],
  ['HOT-ESP', 'Espresso', 'Hot Drinks', .5, 2.5, 80, 15, '☕', 25], ['HOT-LAT', 'Latte', 'Hot Drinks', .9, 3.5, 64, 15, '🥛', 35], ['HOT-TEA', 'Green Tea', 'Hot Drinks', .3, 2.2, 12, 15, '🍵', 140], ['HOT-CHO', 'Hot Chocolate', 'Hot Drinks', .8, 3.2, 40, 10, '🍫', 20],
  ['CLD-ENR', 'Energy Drink', 'Cold Drinks', 1.1, 3.5, 120, 24, '⚡', 200], ['CLD-COL', 'Cola 330ml', 'Cold Drinks', .5, 2, 8, 24, '🥤', 5], ['CLD-ICE', 'Iced Coffee', 'Cold Drinks', 1, 3.8, 45, 12, '🧋', 30], ['CLD-WAT', 'Water 500ml', 'Cold Drinks', .2, 1, 200, 40, '💧', 195],
  ['SNK-CHI', 'Chips', 'Snacks', .6, 2, 90, 20, '🍟', 45], ['SNK-CHO', 'Chocolate Bar', 'Snacks', .7, 2.2, 7, 15, '🍬', 25], ['SNK-POP', 'Popcorn', 'Snacks', .4, 2.5, 50, 10, '🍿', 50], ['SNK-NUT', 'Mixed Nuts', 'Snacks', 1, 3, 33, 10, '🥜', 35],
  ['MEL-BUR', 'Gamer Burger', 'Meals', 3, 8.5, 22, 8, '🍔', 15], ['MEL-PIZ', 'Pizza Slice', 'Meals', 1.2, 4, 36, 10, '🍕', 8], ['MEL-NOO', 'Ramen Bowl', 'Meals', 2, 6.5, 5, 8, '🍜', 20], ['MEL-WRP', 'Chicken Wrap', 'Meals', 2.2, 6, 18, 8, '🌯', 40],
].map(([sku, name, cat, cost, price, stock, reorder, emoji, hue]) => ({ sku, name, cat, cost, price, stock, reorder, emoji, hue }) as Product)

export const MEMBERS: Member[] = NAMES.slice(0, 18).map((n, i) => {
  const tier = TIERS[(i * 3) % 4]
  return { id: 'm' + i, user: n + (10 + ((i * 5 * 17) % 89)), name: ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Morgan'][i % 6] + ' ' + ['K.', 'M.', 'R.', 'T.', 'L.'][i % 5], tier, hours: +(((i * 7) % 24) + .5).toFixed(1), wallet: +(((i * 13) % 80) + 4.5).toFixed(2), lastPc: `PC-${String(((i * 5) % 56) + 1).padStart(2, '0')}`, status: i === 7 ? 'suspended' : i > 15 ? 'new' : 'active', discount: tier === 'VIP' ? 10 : tier === 'Esports Pro' ? 15 : 0, pin: '••••' }
})

export function genIssues(layout: Layout[]): Issue[] {
  const k: [string, Issue['sev'], string][] = [
    ['GPU temperature above 90°C', 'critical', 'GPU hit 94°C under load — check airflow'], ['Thermal throttling', 'high', 'CPU clock dropped to 2.1 GHz'], ['Fan failure', 'high', 'Case fan #2 reporting 0 RPM'],
    ['Agent disconnected', 'critical', 'No heartbeat for 6 min'], ['Disk usage above 85%', 'medium', 'C: drive at 91%'], ['SMART warning', 'high', 'Reallocated sector count rising on NVMe0'],
    ['Packet loss', 'medium', '3.2% loss over 60s'], ['Ping above 60 ms', 'low', 'Average 74 ms (switch port 14)'], ['Network link degraded', 'medium', 'Negotiated 100 Mbps instead of 1 Gbps'],
    ['Game crash', 'medium', 'cs2.exe terminated unexpectedly'], ['DirectX error', 'medium', 'DXGI_ERROR_DEVICE_REMOVED'], ['Driver failure', 'high', 'NVIDIA driver restarted 3× in 1 h'], ['BSOD report', 'critical', 'KERNEL_DATA_INPAGE_ERROR (0x7A)'],
  ]
  return k.map((x, i) => ({ id: uid(), stationId: layout[(i * 4 + 2) % layout.length].id, kind: x[0], sev: x[1], detail: x[2], at: Date.now() - (i + 1) * 420000, resolved: false }))
}

const today = new Date()
const ds = (o: number) => { const d = new Date(today); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10) }
export const RESERVATIONS: Reservation[] = [
  { id: 'r1', who: 'Team Phoenix', target: 'Esports Arena', kind: 'arena', date: ds(0), start: 18, hours: 3, deposit: 60, paid: true, checkedIn: false },
  { id: 'r2', who: 'Birthday · Lina', target: 'VIP Room', kind: 'vip', date: ds(0), start: 14, hours: 4, deposit: 40, paid: true, checkedIn: true },
  { id: 'r3', who: 'Kairo21', target: 'CON-2', kind: 'console', date: ds(0), start: 20, hours: 2, deposit: 5, paid: false, checkedIn: false },
  { id: 'r4', who: 'LAN Night crew', target: 'Main Hall ×8', kind: 'station', date: ds(1), start: 19, hours: 5, deposit: 50, paid: true, checkedIn: false },
  { id: 'r5', who: 'Corporate · Nexa', target: 'VIP Room', kind: 'vip', date: ds(2), start: 10, hours: 6, deposit: 120, paid: true, checkedIn: false },
  { id: 'r6', who: 'Solo · Vex', target: 'CON-1', kind: 'console', date: ds(3), start: 16, hours: 2, deposit: 0, paid: false, checkedIn: false },
  { id: 'r7', who: 'Scrims · Nova', target: 'Esports Arena', kind: 'arena', date: ds(5), start: 17, hours: 4, deposit: 80, paid: true, checkedIn: false },
]

export function buildBracket(teams: string[], format: 'single' | 'double'): Match[] {
  const size = 8, ms: Match[] = []
  const t = [...teams, ...Array(size).fill(null)].slice(0, size)
  for (let i = 0; i < 4; i++) ms.push({ id: `W1-${i}`, round: 1, idx: i, a: t[i * 2], b: t[i * 2 + 1], sa: 0, sb: 0, winner: null, bracket: 'W' })
  for (let i = 0; i < 2; i++) ms.push({ id: `W2-${i}`, round: 2, idx: i, a: null, b: null, sa: 0, sb: 0, winner: null, bracket: 'W' })
  ms.push({ id: 'W3-0', round: 3, idx: 0, a: null, b: null, sa: 0, sb: 0, winner: null, bracket: 'W' })
  if (format === 'double') {
    for (let i = 0; i < 2; i++) ms.push({ id: `L1-${i}`, round: 1, idx: i, a: null, b: null, sa: 0, sb: 0, winner: null, bracket: 'L' })
    ms.push({ id: 'L2-0', round: 2, idx: 0, a: null, b: null, sa: 0, sb: 0, winner: null, bracket: 'L' })
    ms.push({ id: 'GF-0', round: 1, idx: 0, a: null, b: null, sa: 0, sb: 0, winner: null, bracket: 'GF' })
  }
  return ms
}
export const TEAMS = ['Phoenix', 'Night Owls', 'Vortex', 'Lunar', 'Ironclad', 'Pixel Pirates', 'Zenith', 'Nova Five']
export const TOURNAMENTS: Tournament[] = [
  { id: 't1', name: 'Friday Valorant Cup', game: 'Valorant', format: 'single', prize: 500, entry: 10, teams: TEAMS, matches: buildBracket(TEAMS, 'single') },
  { id: 't2', name: 'CS2 Winter Clash', game: 'Counter-Strike 2', format: 'double', prize: 1200, entry: 20, teams: TEAMS, matches: buildBracket(TEAMS, 'double') },
]

export const DEBTS: Debt[] = [
  { id: 'd1', kind: 'Customer Tab', who: 'Kairo21 · PC-12', amount: 14.5, due: ds(0), settled: false }, { id: 'd2', kind: 'Customer Tab', who: 'Rin34 · PC-30', amount: 8, due: ds(0), settled: false },
  { id: 'd3', kind: 'Staff Advance', who: 'Hadi (cashier)', amount: 60, due: ds(7), settled: false }, { id: 'd4', kind: 'Supplier Invoice', who: 'FreshDrinks Co.', amount: 420, due: ds(4), settled: false },
  { id: 'd5', kind: 'Supplier Invoice', who: 'SnackWorld', amount: 185.5, due: ds(-2), settled: false },
]

export const ACTIVITY: Activity[] = [
  [1, 'checkin', 'Nova28 checked in at PC-07'], [3, 'order', 'Order #1042 completed · Latte + Chips → PC-14'], [5, 'session', 'Session ended · Zed12 on PC-22 (2h 05m)'], [8, 'alert', 'GPU 93°C on PC-31 — thermal alert (simulated)'],
  [11, 'payment', 'Payment $25.00 · All-Night Pass · Card'], [14, 'staff', 'Hadi started shift (Opening float $200)'], [17, 'checkin', 'Lyra19 checked in at VIP-3'], [21, 'order', 'Order #1041 completed · Burger → PC-03'],
].map(([m, kind, text]) => ({ id: uid(), t: Date.now() - (m as number) * 60000, kind, text }) as Activity)
