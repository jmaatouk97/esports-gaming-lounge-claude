import { useState, useMemo, useRef, type ReactNode, type InputHTMLAttributes } from 'react'
import { Search, Eye, EyeOff, ChevronDown, Calendar as CalIcon, Clock, ChevronLeft, ChevronRight, X, Check, Upload, Plus, Minus } from 'lucide-react'
import { Button, Glass } from './core'
import { Popover, MenuList } from './overlays'
import { cn } from '../../lib/utils'

export function Field({ label, error, ok, hint, children }: { label?: string; error?: string; ok?: boolean; hint?: string; children: ReactNode }) {
  return <div className="min-w-0">{label && <label className="lbl">{label}</label>}{children}{error ? <p className="text-[11px] mt-1" style={{ color: 'var(--bad)' }} role="alert">{error}</p> : hint ? <p className="text-[11px] mt-1 faint">{hint}</p> : ok ? <p className="text-[11px] mt-1" style={{ color: 'var(--ok)' }}>Looks good</p> : null}</div>
}
export function Input({ label, error, ok, hint, className, ...p }: { label?: string; error?: string; ok?: boolean; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <Field label={label} error={error} ok={ok} hint={hint}><input aria-label={label} aria-invalid={!!error} className={cn('field', error && 'invalid', ok && 'valid', className)} {...p} /></Field>
}
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return <div className={cn('relative', className)}><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 faint" /><input type="search" aria-label={placeholder} className="field !pl-9" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 faint" onClick={() => onChange('')}><X size={14} /></button>}</div>
}
export function PasswordInput({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  const [s, setS] = useState(false)
  return <Field label={label}><div className="relative"><input aria-label={label ?? 'Password'} type={s ? 'text' : 'password'} className="field !pr-10" value={value} onChange={e => onChange(e.target.value)} /><button type="button" aria-label={s ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 muted" onClick={() => setS(!s)}>{s ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></Field>
}
export function NumberInput({ label, value, onChange, min = 0, max = 9999, step = 1, prefix, suffix }: { label?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; prefix?: string; suffix?: string }) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, +v.toFixed(2))))
  return <Field label={label}><div className="flex items-center gap-1"><Button icon size="sm" aria-label="Decrease" onClick={() => set(value - step)}><Minus size={13} /></Button>
    <div className="relative flex-1">{prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 faint text-xs">{prefix}</span>}<input aria-label={label} type="number" className={cn('field tnum text-center !h-8', prefix && '!pl-6', suffix && '!pr-8')} value={value} min={min} max={max} step={step} onChange={e => set(+e.target.value)} />{suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 faint text-xs">{suffix}</span>}</div>
    <Button icon size="sm" aria-label="Increase" onClick={() => set(value + step)}><Plus size={13} /></Button></div></Field>
}
export function Textarea({ label, ...p }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <Field label={label}><textarea aria-label={label} className="field" rows={3} {...p} /></Field> }

/* ---------- Select family ---------- */
export interface Opt { value: string; label: string; hint?: string }
export function Select({ label, value, options, onChange, placeholder = 'Select…', className }: { label?: string; value: string; options: Opt[]; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const cur = options.find(o => o.value === value)
  return (
    <Field label={label}>
      <Popover width="trigger" className="max-h-72 overflow-y-auto" trigger={
        <button type="button" aria-label={label ?? placeholder} className={cn('field flex items-center justify-between text-left', className)} style={{ cursor: 'pointer' }}><span className={cur ? '' : 'faint'}>{cur?.label ?? placeholder}</span><ChevronDown size={14} className="muted" /></button>}>
        {close => <MenuList onDone={close} items={options.map(o => ({ label: o.label, checked: o.value === value, onClick: () => onChange(o.value) }))} />}
      </Popover>
    </Field>
  )
}
export function MultiSelect({ label, values, options, onChange }: { label?: string; values: string[]; options: Opt[]; onChange: (v: string[]) => void }) {
  return (
    <Field label={label}>
      <Popover width="trigger" className="max-h-72 overflow-y-auto" trigger={<button type="button" aria-label={label ?? 'Multi select'} className="field flex items-center justify-between text-left gap-1" style={{ cursor: 'pointer', height: 'auto', minHeight: 38, padding: '6px 12px' }}>
        <span className="flex flex-wrap gap-1">{values.length ? values.map(v => <span key={v} className="badge acc">{options.find(o => o.value === v)?.label}</span>) : <span className="faint">Select multiple…</span>}</span><ChevronDown size={14} className="muted shrink-0" /></button>}>
        {() => <div role="listbox" aria-multiselectable>{options.map(o => { const on = values.includes(o.value); return <button key={o.value} role="option" aria-selected={on} className="menu-item" onClick={() => onChange(on ? values.filter(v => v !== o.value) : [...values, o.value])}><span className={cn('cb', on && 'on')}>{on && <Check size={11} color="#fff" strokeWidth={3} />}</span>{o.label}</button> })}</div>}
      </Popover>
    </Field>
  )
}
export function Combobox({ label, value, options, onChange, placeholder = 'Type to search…' }: { label?: string; value: string; options: Opt[]; onChange: (v: string) => void; placeholder?: string }) {
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), cur = options.find(o => o.value === value)
  const list = options.filter(o => (o.label + (o.hint ?? '')).toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  return (
    <Field label={label}>
      <div className="relative">
        <input role="combobox" aria-expanded={open} aria-label={label ?? placeholder} className="field" placeholder={placeholder} value={open ? q : cur?.label ?? ''} onFocus={() => { setOpen(true); setQ('') }} onBlur={() => setTimeout(() => setOpen(false), 140)} onChange={e => setQ(e.target.value)} />
        {open && <div className="glass-deep absolute z-30 left-0 right-0 top-full mt-1 p-1.5 anim-menu max-h-60 overflow-y-auto" style={{ borderRadius: 14 }} role="listbox">
          {list.length ? list.map(o => <button key={o.value} role="option" aria-selected={o.value === value} className="menu-item" onMouseDown={() => { onChange(o.value); setOpen(false) }}><span className="flex-1">{o.label}</span>{o.hint && <span className="faint text-[11px]">{o.hint}</span>}</button>) : <div className="p-3 text-xs faint">No matches</div>}</div>}
      </div>
    </Field>
  )
}

/* ---------- Dates ---------- */
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export function Calendar({ value, range, onPick, marks, month: m0, big }: { value?: string; range?: [string | null, string | null]; onPick: (iso: string) => void; marks?: Record<string, number>; month?: string; big?: boolean }) {
  const [view, setView] = useState(() => { const d = value ? parseISO(value) : m0 ? parseISO(m0) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const cells = useMemo(() => { const start = new Date(view); start.setDate(1 - view.getDay()); return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d }) }, [view])
  const today = iso(new Date())
  return (
    <div className={big ? 'w-full' : 'w-[272px]'}>
      <div className="flex items-center justify-between mb-2">
        <Button icon size="sm" v="ghost" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><ChevronLeft size={15} /></Button>
        <div className="text-sm font-bold">{view.toLocaleString('en', { month: 'long', year: 'numeric' })}</div>
        <Button icon size="sm" v="ghost" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><ChevronRight size={15} /></Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center" role="grid">
        {DOW.map(d => <div key={d} className="text-[10px] font-bold faint py-1">{d}</div>)}
        {cells.map(d => {
          const k = iso(d), out = d.getMonth() !== view.getMonth(), sel = k === value, [a, b] = range ?? [null, null]
          const inR = a && b && k >= a && k <= b, edge = k === a || k === b
          return (
            <button key={k} aria-label={k} aria-pressed={sel || !!edge} onClick={() => onPick(k)} className={cn('relative rounded-lg tnum transition-colors duration-150 focus-ring', big ? 'h-14 text-sm' : 'h-8 text-xs', out && 'opacity-35', !sel && !edge && !inR && 'hover:bg-white/10')}
              style={sel || edge ? { background: 'var(--accent)', color: '#fff', fontWeight: 700 } : inR ? { background: 'color-mix(in srgb,var(--accent) 22%,transparent)' } : k === today ? { boxShadow: 'inset 0 0 0 1.5px var(--accent)' } : undefined}>
              {d.getDate()}
              {marks?.[k] ? <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">{Array.from({ length: Math.min(3, marks[k]) }).map((_, i) => <i key={i} className="w-1 h-1 rounded-full" style={{ background: sel || edge ? '#fff' : 'var(--accent2)' }} />)}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
const fmtD = (s: string) => parseISO(s).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
export function DatePicker({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return <Field label={label}><Popover width={300} trigger={<button type="button" aria-label={label ?? 'Pick date'} className="field flex items-center gap-2 text-left" style={{ cursor: 'pointer' }}><CalIcon size={14} className="muted" /><span className="flex-1 tnum">{value ? fmtD(value) : 'Pick a date'}</span></button>}>
    {close => <div className="p-2"><Calendar value={value} onPick={d => { onChange(d); close() }} /></div>}</Popover></Field>
}
export function DateRangePicker({ label, value, onChange }: { label?: string; value: [string | null, string | null]; onChange: (v: [string | null, string | null]) => void }) {
  const pick = (d: string) => { const [a, b] = value; if (!a || (a && b)) onChange([d, null]); else onChange(d < a ? [d, a] : [a, d]) }
  const [a, b] = value
  return <Field label={label}><Popover width={300} trigger={<button type="button" aria-label={label ?? 'Pick date range'} className="field flex items-center gap-2 text-left" style={{ cursor: 'pointer' }}><CalIcon size={14} className="muted" /><span className="flex-1 tnum truncate">{a ? fmtD(a) : 'Start'} → {b ? fmtD(b) : 'End'}</span></button>}>
    {() => <div className="p-2"><Calendar range={value} onPick={pick} /><div className="text-[11px] faint text-center mt-2">{!a ? 'Choose start date' : !b ? 'Choose end date' : 'Range selected'}</div></div>}</Popover></Field>
}
export function TimePicker({ label, value, onChange, step = 30 }: { label?: string; value: string; onChange: (v: string) => void; step?: number }) {
  const slots = Array.from({ length: (24 * 60) / step }, (_, i) => { const m = i * step; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` })
  return <Field label={label}><Popover width={140} className="max-h-64 overflow-y-auto" trigger={<button type="button" aria-label={label ?? 'Pick time'} className="field flex items-center gap-2 text-left" style={{ cursor: 'pointer' }}><Clock size={14} className="muted" /><span className="flex-1 tnum">{value}</span></button>}>
    {close => <div>{slots.map(s => <button key={s} className={cn('menu-item tnum', s === value && 'active')} onClick={() => { onChange(s); close() }}>{s}</button>)}</div>}</Popover></Field>
}
export function DateTimePicker({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  const [d, t] = value.split('T')
  return <div className="grid grid-cols-2 gap-2"><DatePicker label={label ? label + ' · date' : 'Date'} value={d} onChange={x => onChange(`${x}T${t}`)} /><TimePicker label={label ? label + ' · time' : 'Time'} value={t} onChange={x => onChange(`${d}T${x}`)} /></div>
}
export function ColorPicker({ label, value, onChange, colors }: { label?: string; value: string; onChange: (v: string) => void; colors?: string[] }) {
  const cs = colors ?? ['#6F9DFF', '#38BDF8', '#34D399', '#A78BFA', '#F43F5E', '#F59E0B', '#EA580C', '#D946EF', '#22D3EE', '#FACC15']
  return <Field label={label}><div className="flex flex-wrap items-center gap-2">{cs.map(c => <button key={c} aria-label={c} aria-pressed={c === value} onClick={() => onChange(c)} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus-ring" style={{ background: c, borderColor: c === value ? '#fff' : 'transparent', boxShadow: c === value ? `0 0 0 2px ${c}` : undefined }} />)}<input type="color" aria-label="Custom color" value={value} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded-full bg-transparent border-0 cursor-pointer" /></div></Field>
}
export function FileUpload({ label, onFiles }: { label?: string; onFiles?: (f: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([]), [over, setOver] = useState(false), ref = useRef<HTMLInputElement>(null)
  const add = (fl: FileList | null) => { if (!fl) return; const a = Array.from(fl); setFiles(a); onFiles?.(a) }
  return <Field label={label}><div onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }} onClick={() => ref.current?.click()} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && ref.current?.click()}
    className="inset-glass flex flex-col items-center gap-1 py-5 cursor-pointer text-center focus-ring" style={{ borderStyle: 'dashed', borderColor: over ? 'var(--accent)' : undefined }}><Upload size={20} className="muted" /><span className="text-[13px] font-semibold">{files.length ? files.map(f => f.name).join(', ') : 'Drop files or click to browse'}</span><span className="text-[11px] faint">PNG, JPG, SVG — stays in your browser</span><input ref={ref} type="file" multiple hidden onChange={e => add(e.target.files)} /></div></Field>
}

/* ---------- Schedulers ---------- */
export interface Slot { id: string; row: string; day?: number; start: number; hours: number; title: string; tone?: string }
export function TimelineScheduler({ rows, slots, from = 10, to = 24, onMove, onPick }: { rows: string[]; slots: Slot[]; from?: number; to?: number; onMove?: (id: string, row: string, start: number) => void; onPick?: (s: Slot) => void }) {
  const hrs = to - from, [drag, setDrag] = useState<string | null>(null)
  return (
    <div className="overflow-x-auto"><div style={{ minWidth: 640 }}>
      <div className="grid" style={{ gridTemplateColumns: `110px repeat(${hrs}, 1fr)` }}>
        <div />{Array.from({ length: hrs }, (_, i) => <div key={i} className="text-[10px] faint tnum text-center py-1">{String(from + i).padStart(2, '0')}</div>)}
        {rows.map(r => (
          <div key={r} className="contents">
            <div className="text-xs font-semibold py-2 pr-2 truncate self-center">{r}</div>
            <div className="relative border-t border-white/10" style={{ gridColumn: `span ${hrs}`, height: 40 }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'), rc = e.currentTarget.getBoundingClientRect(), h = Math.round(((e.clientX - rc.left) / rc.width) * hrs) + from; setDrag(null); onMove?.(id, r, Math.max(from, Math.min(to - 1, h))) }}>
              {Array.from({ length: hrs }, (_, i) => <i key={i} className="absolute top-0 bottom-0 w-px" style={{ left: `${(i / hrs) * 100}%`, background: 'rgba(var(--gc),.07)' }} />)}
              {slots.filter(s => s.row === r).map(s => (
                <button key={s.id} draggable={!!onMove} onDragStart={e => { e.dataTransfer.setData('text/plain', s.id); setDrag(s.id) }} onDragEnd={() => setDrag(null)} onClick={() => onPick?.(s)} title={`${s.title} · ${s.start}:00–${s.start + s.hours}:00`}
                  className="absolute top-1 bottom-1 rounded-lg px-2 text-[11px] font-semibold text-left truncate text-white border border-white/30 cursor-grab active:cursor-grabbing" style={{ left: `${((s.start - from) / hrs) * 100}%`, width: `${(s.hours / hrs) * 100}%`, background: s.tone ?? 'var(--accent)', opacity: drag === s.id ? .4 : .92 }}>{s.title}</button>))}
            </div>
          </div>))}
      </div></div>
    </div>
  )
}
export function WeekScheduler({ start, slots, onPick, from = 10, to = 24 }: { start: Date; slots: Slot[]; onPick?: (s: Slot) => void; from?: number; to?: number }) {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() - start.getDay() + i); return d })
  return (
    <div className="overflow-x-auto"><div className="grid" style={{ gridTemplateColumns: '44px repeat(7, minmax(84px,1fr))', minWidth: 660 }}>
      <div />{days.map(d => <div key={+d} className="text-center py-1.5"><div className="text-[10px] faint font-bold uppercase">{DOW[d.getDay()]}</div><div className={cn('text-sm font-bold tnum', iso(d) === iso(new Date()) && 'accent')} style={iso(d) === iso(new Date()) ? { color: 'var(--accent)' } : undefined}>{d.getDate()}</div></div>)}
      <div className="relative" style={{ height: (to - from) * 28 }}>{Array.from({ length: to - from }, (_, i) => <div key={i} className="absolute text-[10px] faint tnum" style={{ top: i * 28 - 5 }}>{String(from + i).padStart(2, '0')}</div>)}</div>
      {days.map((d, di) => (
        <div key={di} className="relative border-l border-white/10" style={{ height: (to - from) * 28 }}>
          {Array.from({ length: to - from }, (_, i) => <i key={i} className="absolute left-0 right-0 h-px" style={{ top: i * 28, background: 'rgba(var(--gc),.07)' }} />)}
          {slots.filter(s => s.day === di).map(s => <button key={s.id} onClick={() => onPick?.(s)} className="absolute left-0.5 right-0.5 rounded-md px-1.5 text-[10px] font-semibold text-left text-white overflow-hidden border border-white/30" style={{ top: (s.start - from) * 28, height: s.hours * 28 - 2, background: s.tone ?? 'var(--accent)' }}>{s.title}</button>)}
        </div>))}
    </div></div>
  )
}
export const GlassPanelPad = Glass
