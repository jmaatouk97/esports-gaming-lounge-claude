export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')
export const fmtTime = (s: number) => {
  s = Math.max(0, Math.floor(s))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`
}
export const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
export function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export const uid = () => Math.random().toString(36).slice(2, 9)
export const ago = (min: number) => { const d = new Date(Date.now() - min * 60000); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
