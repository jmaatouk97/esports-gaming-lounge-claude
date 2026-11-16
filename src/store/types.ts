export type StationType = 'standard' | 'dual' | 'vip' | 'console' | 'table' | 'stream'
export type Status = 'available' | 'in-use' | 'locked' | 'offline' | 'reserved' | 'maintenance'
export type Tier = 'Guest' | 'Standard' | 'VIP' | 'Esports Pro'

export interface Layout { id: string; name: string; type: StationType; x: number; y: number; w: number; h: number; rot: number; zone: string }
export interface Zone { id: string; name: string; x: number; y: number; w: number; h: number; hue: string }
export interface Furniture { id: string; kind: 'desk' | 'sofa' | 'plant' | 'counter' | 'wall'; x: number; y: number; w: number; h: number; rot: number }
export interface Label { id: string; text: string; x: number; y: number }
export interface FloorLayout { stations: Layout[]; zones: Zone[]; furniture: Furniture[]; labels: Label[] }

export interface HistoryEvt { t: number; kind: 'power' | 'login' | 'session' | 'time' | 'order' | 'extend' | 'logout' | 'remote'; text: string }
export interface Live {
  id: string; status: Status; user: string | null; tier: Tier | null; pkg: string | null
  startedAt: number | null; remaining: number; cost: number
  game: string; proc: string; procStatus: string
  cpu: number; gpu: number; cpuT: number; gpuT: number; ram: number; disk: number; ping: number; loss: number; fps: number
  sCpu: number[]; sPing: number[]; sGpu: number[]
  agent: string; history: HistoryEvt[]; orders: number; simulated: true
}
export interface Spec { cpu: string; gpu: string; ram: string; storage: string; board: string; monitor: string; hz: number; os: string; serial: string; games: { n: string; patch: 'current' | 'outdated' | 'updating' }[] }

export interface Product { sku: string; name: string; cat: 'Gaming Packages' | 'Hot Drinks' | 'Cold Drinks' | 'Snacks' | 'Meals'; cost: number; price: number; stock: number; reorder: number; emoji: string; hue: number }
export interface CartItem { sku: string; qty: number }
export interface Member { id: string; user: string; name: string; tier: Tier; hours: number; wallet: number; lastPc: string; status: 'active' | 'suspended' | 'new'; discount: number; pin: string }
export interface Issue { id: string; stationId: string; kind: string; sev: 'critical' | 'high' | 'medium' | 'low'; detail: string; at: number; resolved: boolean }
export interface Reservation { id: string; who: string; target: string; kind: 'station' | 'vip' | 'console' | 'arena'; date: string; start: number; hours: number; deposit: number; paid: boolean; checkedIn: boolean }
export interface Match { id: string; round: number; idx: number; a: string | null; b: string | null; sa: number; sb: number; winner: string | null; bracket: 'W' | 'L' | 'GF' }
export interface Tournament { id: string; name: string; game: string; format: 'single' | 'double'; prize: number; entry: number; teams: string[]; matches: Match[] }
export interface Debt { id: string; kind: 'Customer Tab' | 'Staff Advance' | 'Supplier Invoice'; who: string; amount: number; due: string; settled: boolean }
export interface Activity { id: string; t: number; kind: 'checkin' | 'order' | 'session' | 'alert' | 'staff' | 'payment'; text: string }
export interface Notice { id: string; t: number; title: string; body?: string; level: 'info' | 'ok' | 'warn' | 'bad'; read: boolean; simulated?: boolean }
