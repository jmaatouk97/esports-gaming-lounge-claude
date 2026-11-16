import { useMemo, useState, type ReactNode } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown, TrendingUp, TrendingDown, Search } from 'lucide-react'
import { Glass } from './core'
import { cn } from '../../lib/utils'

export function Sparkline({ data, w = 80, h = 22, color = 'var(--accent)', fill = true }: { data: number[]; w?: number; h?: number; color?: string; fill?: boolean }) {
  if (data.length < 2) return null
  const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - mn) / r) * (h - 4)])
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ overflow: 'visible' }}>
      {fill && <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={color} opacity={.16} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function MicroBar({ value, max = 100, color, w = 34, warn = 999 }: { value: number; max?: number; color?: string; w?: number; warn?: number }) {
  const p = Math.min(100, (value / max) * 100)
  return <span className="inline-block h-1 rounded-full overflow-hidden align-middle" style={{ width: w, background: 'rgba(128,128,160,.28)' }}><span className="block h-full rounded-full" style={{ width: p + '%', background: value >= warn ? 'var(--bad)' : color ?? 'var(--accent)' }} /></span>
}

export function Kpi({ label, value, delta, icon, spark, sub, tone }: { label: string; value: ReactNode; delta?: number; icon?: ReactNode; spark?: number[]; sub?: string; tone?: string }) {
  const up = (delta ?? 0) >= 0
  return (
    <Glass className="p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-wider muted truncate">{label}</span><span className="muted shrink-0" style={tone ? { color: tone } : undefined}>{icon}</span></div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-2xl font-bold tnum leading-none truncate">{value}</div>
        {spark && <Sparkline data={spark} w={64} h={26} color={tone} />}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {delta != null && <span className={cn('inline-flex items-center gap-1 font-semibold tnum')} style={{ color: up ? 'var(--ok)' : 'var(--bad)' }}>{up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{up ? '+' : ''}{delta.toFixed(1)}%</span>}
        {sub && <span className="faint truncate">{sub}</span>}
      </div>
    </Glass>
  )
}

export interface Col<T> { key: string; label: string; render?: (r: T) => ReactNode; sort?: (a: T, b: T) => number; className?: string }
export function DataTable<T extends { [k: string]: any }>({ rows, cols, rowKey, search, searchKeys, empty, onRow, toolbar, maxH = 'none', className }: { rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; search?: boolean; searchKeys?: string[]; empty?: ReactNode; onRow?: (r: T) => void; toolbar?: ReactNode; maxH?: string; className?: string }) {
  const [q, setQ] = useState(''), [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null)
  const data = useMemo(() => {
    let r = rows
    if (q) { const s = q.toLowerCase(); r = r.filter(x => (searchKeys ?? cols.map(c => c.key)).some(k => String(x[k] ?? '').toLowerCase().includes(s))) }
    if (sort) { const c = cols.find(c => c.key === sort.k); r = [...r].sort((a, b) => sort.dir * (c?.sort ? c.sort(a, b) : String(a[sort.k]).localeCompare(String(b[sort.k]), undefined, { numeric: true }))) }
    return r
  }, [rows, q, sort, cols, searchKeys])
  return (
    <Glass className={cn('overflow-hidden', className)}>
      {(search || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 p-3">
          {search && <div className="relative flex-1 min-w-[160px] max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 faint" /><input className="field !pl-9 !h-9" placeholder="Search…" aria-label="Search table" value={q} onChange={e => setQ(e.target.value)} /></div>}
          <div className="flex flex-wrap items-center gap-2 ml-auto">{toolbar}</div>
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight: maxH }}>
        <table className="gt">
          <thead><tr>{cols.map(c => (
            <th key={c.key} className={c.className} aria-sort={sort?.k === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
              <button className="inline-flex items-center gap-1 uppercase font-semibold tracking-wider focus-ring" onClick={() => setSort(s => s?.k === c.key ? (s.dir === 1 ? { k: c.key, dir: -1 } : null) : { k: c.key, dir: 1 })}>
                {c.label}{sort?.k === c.key ? (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ChevronsUpDown size={11} className="opacity-40" />}
              </button></th>))}</tr></thead>
          <tbody>
            {data.map(r => <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'cursor-pointer' : ''}>{cols.map(c => <td key={c.key} className={c.className}>{c.render ? c.render(r) : String(r[c.key] ?? '')}</td>)}</tr>)}
          </tbody>
        </table>
        {!data.length && <div className="p-6 text-center sub">{empty ?? 'No results'}</div>}
      </div>
    </Glass>
  )
}

export function Timeline({ items }: { items: { t: string; title: string; icon?: ReactNode; tone?: string }[] }) {
  return (
    <ol className="relative pl-5">
      <span className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: 'rgba(var(--gc),.2)' }} />
      {items.map((i, k) => (
        <li key={k} className="relative pb-3 last:pb-0">
          <span className="absolute -left-5 top-1 w-[15px] h-[15px] rounded-full grid place-items-center border border-white/30" style={{ background: i.tone ?? 'var(--accent)' }}>{i.icon}</span>
          <div className="text-[13px] leading-tight">{i.title}</div><div className="text-[11px] faint tnum">{i.t}</div>
        </li>
      ))}
    </ol>
  )
}
