import { useState, useRef, useId, type ReactNode, type HTMLAttributes, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { ChevronDown, ChevronRight, ChevronLeft, Loader2, Check, Inbox, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ---------- Glass surface ---------- */
export type Material = 'frosted' | 'lite' | 'deep' | 'tint' | 'clear' | 'dark' | 'light'
export function Glass({ m = 'frosted', className, children, ...p }: { m?: Material; children?: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const cls = m === 'lite' ? 'glass-lite' : m === 'deep' ? 'glass-deep' : m === 'tint' ? 'glass glass-tint' : m === 'clear' ? 'glass glass-clear' : m === 'dark' ? 'glass glass-dark' : m === 'light' ? 'glass glass-light' : 'glass'
  return <div className={cn(cls, className)} {...p}>{children}</div>
}

/* ---------- Buttons ---------- */
export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> { v?: 'default' | 'primary' | 'danger' | 'ghost'; size?: 'sm' | 'md' | 'lg'; icon?: boolean; loading?: boolean; on?: boolean }
export function Button({ v = 'default', size = 'md', icon, loading, on, className, children, disabled, ...p }: BtnProps) {
  return (
    <button className={cn('btn', v !== 'default' && v, size !== 'md' && size, icon && 'icon', on && 'on', className)} disabled={disabled || loading} {...p}>
      {loading && <Loader2 size={14} className="animate-spin" />}{children}
    </button>
  )
}
export function ButtonGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('inline-flex [&>.btn]:rounded-none [&>.btn:first-child]:rounded-l-xl [&>.btn:last-child]:rounded-r-xl [&>.btn:not(:first-child)]:-ml-px', className)} role="group">{children}</div>
}
export function Fab({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return <button aria-label={label} onClick={onClick} className="btn primary icon !w-14 !h-14 !rounded-full" style={{ ['--h' as string]: '56px' }}>{children}</button>
}

export function Badge({ tone, children, className, dot }: { tone?: 'ok' | 'warn' | 'bad' | 'info' | 'acc'; children: ReactNode; className?: string; dot?: boolean }) {
  return <span className={cn('badge', tone, className)}>{dot && <span className="dot" style={{ background: 'currentColor', width: 6, height: 6 }} />}{children}</span>
}
export const tierTone = (t: string | null) => (t === 'Esports Pro' ? 'bad' : t === 'VIP' ? 'acc' : t === 'Standard' ? 'info' : undefined) as 'bad' | 'acc' | 'info' | undefined

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className, size = 'md' }: { tabs: { id: T; label: string; icon?: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="tablist" className={cn('glass !rounded-2xl p-1 inline-flex gap-1 max-w-full noscroll-x', className)}>
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn('focus-ring relative flex items-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200', size === 'sm' ? 'px-3 h-8 text-xs' : 'px-4 h-9 text-[13px]', value === t.id ? 'text-white' : 'muted hover:bg-white/10')}
          style={value === t.id ? { background: 'linear-gradient(180deg,color-mix(in srgb,var(--accent) 85%,#fff),color-mix(in srgb,var(--accent) 65%,#000))', boxShadow: '0 4px 16px color-mix(in srgb,var(--accent) 40%,transparent), inset 0 1px 0 rgba(255,255,255,.4)' } : undefined}>
          {t.icon}{t.label}{t.count != null && <span className="badge !h-4 !px-1.5">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs muted">{items.map((x, i) => <span key={i} className="flex items-center gap-1">{i > 0 && <ChevronRight size={12} />}<span className={i === items.length - 1 ? 'font-semibold' : ''} style={i === items.length - 1 ? { color: 'var(--text)' } : undefined}>{x}</span></span>)}</nav>
}
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  const list = Array.from({ length: pages }, (_, i) => i + 1)
  return (
    <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
      <Button size="sm" icon aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={14} /></Button>
      {list.map(p => <Button key={p} size="sm" icon v={p === page ? 'primary' : 'ghost'} onClick={() => onChange(p)} aria-current={p === page}>{p}</Button>)}
      <Button size="sm" icon aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={14} /></Button>
    </div>
  )
}
export function Accordion({ items }: { items: { id: string; title: string; body: ReactNode }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  return (
    <div className="glass overflow-hidden divide-y divide-white/10">
      {items.map(i => (
        <div key={i.id}>
          <button className="focus-ring w-full flex items-center justify-between px-4 py-3 text-sm font-semibold" aria-expanded={open === i.id} onClick={() => setOpen(open === i.id ? null : i.id)}>
            {i.title}<ChevronDown size={16} className="transition-transform duration-200" style={{ transform: open === i.id ? 'rotate(180deg)' : 'none' }} />
          </button>
          <div style={{ display: 'grid', gridTemplateRows: open === i.id ? '1fr' : '0fr', transition: 'grid-template-rows .28s cubic-bezier(.23,1,.32,1)' }}>
            <div className="overflow-hidden"><div className="px-4 pb-4 text-[13px] muted">{i.body}</div></div>
          </div>
        </div>
      ))}
    </div>
  )
}
export function Expandable({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [o, setO] = useState(defaultOpen)
  return (
    <div className="glass">
      <button className="focus-ring w-full flex items-center justify-between px-4 py-3 text-sm font-semibold" onClick={() => setO(!o)} aria-expanded={o}>{title}<ChevronDown size={16} style={{ transform: o ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></button>
      {o && <div className="px-4 pb-4 anim-in">{children}</div>}
    </div>
  )
}
export const Separator = ({ label }: { label?: string }) => label ? <div className="flex items-center gap-3 faint text-[11px] uppercase tracking-widest font-semibold"><hr className="hair flex-1" />{label}<hr className="hair flex-1" /></div> : <hr className="hair" />

/* ---------- Section / page chrome ---------- */
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div><h1 className="h1">{title}</h1>{sub && <p className="sub mt-0.5">{sub}</p>}</div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  )
}
export function Card({ title, right, children, className, pad = true, ...p }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean } & Omit<HTMLAttributes<HTMLDivElement>, 'title'>) {
  return (
    <section className={cn('glass', className)} {...p}>
      {(title || right) && <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1"><h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>{right}</header>}
      <div className={pad ? 'p-4 pt-2.5' : ''}>{children}</div>
    </section>
  )
}

/* ---------- Feedback states ---------- */
export const Skeleton = ({ className, style }: { className?: string; style?: CSSProperties }) => <div className={cn('skeleton', className)} style={style} aria-hidden />
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center text-center py-10 gap-2"><div className="glass !rounded-2xl p-4"><Inbox size={26} className="muted" /></div><div className="font-semibold">{title}</div>{body && <div className="sub max-w-xs">{body}</div>}{action}</div>
}
export function ErrorState({ title, body, onRetry }: { title: string; body?: string; onRetry?: () => void }) {
  return <div className="flex flex-col items-center text-center py-10 gap-2"><div className="glass !rounded-2xl p-4" style={{ color: 'var(--bad)' }}><AlertTriangle size={26} /></div><div className="font-semibold">{title}</div>{body && <div className="sub max-w-xs">{body}</div>}{onRetry && <Button size="sm" onClick={onRetry}>Retry</Button>}</div>
}
export function Avatar({ name, size = 32, color }: { name: string; size?: number; color?: string }) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return <div className="rounded-full grid place-items-center font-bold text-white shrink-0 border border-white/30" style={{ width: size, height: size, fontSize: size * .38, background: color ?? `linear-gradient(135deg,hsl(${h} 80% 62%),hsl(${(h + 50) % 360} 70% 45%))` }} aria-label={name}>{name.slice(0, 2).toUpperCase()}</div>
}
export function AvatarGroup({ names, max = 4 }: { names: string[]; max?: number }) {
  return <div className="flex -space-x-2">{names.slice(0, max).map(n => <Avatar key={n} name={n} size={28} />)}{names.length > max && <div className="w-7 h-7 rounded-full glass grid place-items-center text-[10px] font-bold">+{names.length - max}</div>}</div>
}

/* ---------- Form atoms ---------- */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className="focus-ring inline-flex items-center gap-2 disabled:opacity-40">
      <span className="relative w-10 h-6 rounded-full border border-white/20 transition-colors duration-200" style={{ background: checked ? 'var(--accent)' : 'rgba(var(--gc),.14)' }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200" style={{ left: 2, transform: checked ? 'translateX(16px)' : 'none', transitionTimingFunction: 'cubic-bezier(.23,1,.32,1)' }} />
      </span>{label && <span className="text-[13px]">{label}</span>}
    </button>
  )
}
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className="focus-ring inline-flex items-center gap-2"><span className={cn('cb', checked && 'on')} style={{ width: 18, height: 18 }}>{checked && <Check size={12} color="#fff" strokeWidth={3} />}</span>{label && <span className="text-[13px]">{label}</span>}</button>
}
export function RadioGroup<T extends string>({ options, value, onChange, name }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; name?: string }) {
  const g = useId()
  return <div role="radiogroup" aria-label={name ?? g} className="flex flex-wrap gap-3">{options.map(o => <button key={o.id} role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)} className="focus-ring inline-flex items-center gap-2 text-[13px]"><span className="w-[18px] h-[18px] rounded-full border-2 grid place-items-center" style={{ borderColor: value === o.id ? 'var(--accent)' : 'rgba(var(--gc),.4)' }}>{value === o.id && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}</span>{o.label}</button>)}</div>
}
export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, unit = '' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; unit?: string }) {
  const p = ((value - min) / (max - min)) * 100
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1"><span className="muted font-medium">{label}</span><span className="tnum">{value}{unit}</span></div>}
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} style={{ ['--p' as string]: p + '%' }} />
    </div>
  )
}
export function RangeSlider({ value, onChange, min = 0, max = 100, label }: { value: [number, number]; onChange: (v: [number, number]) => void; min?: number; max?: number; label?: string }) {
  const [a, b] = value, pa = ((a - min) / (max - min)) * 100, pb = ((b - min) / (max - min)) * 100
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1"><span className="muted font-medium">{label}</span><span className="tnum">{a} – {b}</span></div>}
      <div className="relative h-6">
        <div className="absolute top-[9px] h-1.5 left-0 right-0 rounded-full" style={{ background: `linear-gradient(90deg, rgba(var(--gc),.18) ${pa}%, var(--accent) ${pa}%, var(--accent) ${pb}%, rgba(var(--gc),.18) ${pb}%)` }} />
        {[0, 1].map(i => <input key={i} type="range" aria-label={i ? 'Maximum' : 'Minimum'} min={min} max={max} value={value[i]} onChange={e => { const v = +e.target.value; onChange(i ? [a, Math.max(v, a)] : [Math.min(v, b), b]) }} className="absolute inset-0 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-runnable-track]:!bg-transparent [&::-moz-range-thumb]:pointer-events-auto" style={{ background: 'transparent' }} />)}
      </div>
    </div>
  )
}
export function Progress({ value, tone, className, label }: { value: number; tone?: string; className?: string; label?: string }) {
  return <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className={cn('h-1.5 rounded-full overflow-hidden', className)} style={{ background: 'rgba(var(--gc),.14)' }}><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone ?? 'linear-gradient(90deg,var(--accent),var(--accent2))' }} /></div>
}
export function Circular({ value, size = 64, stroke = 7, children, tone }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }} role="progressbar" aria-valuenow={Math.round(value)}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(128,128,160,.25)" strokeWidth={stroke} fill="none" /><circle cx={size / 2} cy={size / 2} r={r} stroke={tone ?? 'var(--accent)'} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.23,1,.32,1)' }} /></svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-bold tnum">{children ?? `${Math.round(value)}%`}</div>
    </div>
  )
}
export function useDisclosure(init = false) { const [open, set] = useState(init); return { open, onOpen: () => set(true), onClose: () => set(false), toggle: () => set(o => !o), set } }
export const useRef0 = useRef
