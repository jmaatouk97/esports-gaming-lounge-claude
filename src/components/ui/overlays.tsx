import { useEffect, useLayoutEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, Check, Info, AlertTriangle, CheckCircle2, XCircle, FlaskConical } from 'lucide-react'
import { Button, Glass } from './core'
import { cn } from '../../lib/utils'
import { useStore } from '../../store/useStore'

/** Plays a short exit animation, then calls onClose. */
function useExit(onClose: () => void, ms = 180) {
  const [leaving, setLeaving] = useState(false)
  const close = useCallback(() => { setLeaving(true); setTimeout(onClose, ms) }, [onClose, ms])
  return { leaving, close }
}
function useEsc(fn: () => void) { useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fn() } }; window.addEventListener('keydown', h, true); return () => window.removeEventListener('keydown', h, true) }, [fn]) }
function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null, el = ref.current
    const f = el?.querySelector<HTMLElement>('[data-autofocus],input,textarea,select,button:not([data-close])') ?? el
    setTimeout(() => f?.focus?.({ preventScroll: true }), 30)
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !el) return
      const n = Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"]),a[href]')).filter(x => x.offsetParent !== null)
      if (!n.length) return
      const a = n[0], b = n[n.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus() } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', h)
    return () => { document.removeEventListener('keydown', h); prev?.focus?.({ preventScroll: true }) }
  }, [ref])
}

export function Modal({ open = true, onClose, title, children, footer, size = 'md', icon }: { open?: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; icon?: ReactNode }) {
  if (!open) return null
  return <ModalInner onClose={onClose} title={title} footer={footer} size={size} icon={icon}>{children}</ModalInner>
}
function ModalInner({ onClose, title, children, footer, size, icon }: { onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size: string; icon?: ReactNode }) {
  const { leaving, close } = useExit(onClose), ref = useRef<HTMLDivElement>(null)
  useEsc(close); useFocusTrap(ref)
  const w = { sm: 380, md: 480, lg: 640, xl: 860 }[size as 'sm']
  return createPortal(
    <div className="scrim grid place-items-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) close() }} style={{ opacity: leaving ? 0 : 1, transition: 'opacity .18s' }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Dialog'} tabIndex={-1} className="glass-deep w-full flex flex-col max-h-[88vh] outline-none" style={{ maxWidth: w, animation: leaving ? undefined : 'popIn .26s cubic-bezier(.23,1,.32,1)', transform: leaving ? 'scale(.97)' : undefined, transition: 'transform .18s' }}>
        {title && <header className="flex items-center gap-3 px-5 pt-4 pb-2">{icon}<h2 className="text-base font-bold tracking-tight flex-1">{title}</h2><Button v="ghost" icon size="sm" onClick={close} aria-label="Close dialog" data-close><X size={16} /></Button></header>}
        <div className="px-5 py-3 overflow-y-auto text-[13px]">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 px-5 pb-4 pt-2">{footer}</footer>}
      </div>
    </div>, document.body)
}

export function Drawer({ open = true, onClose, side = 'right', width = 480, title, header, children }: { open?: boolean; onClose: () => void; side?: 'right' | 'left' | 'bottom'; width?: number; title?: ReactNode; header?: ReactNode; children: ReactNode }) {
  if (!open) return null
  return <DrawerInner onClose={onClose} side={side} width={width} title={title} header={header}>{children}</DrawerInner>
}
function DrawerInner({ onClose, side, width, title, header, children }: { onClose: () => void; side: string; width: number; title?: ReactNode; header?: ReactNode; children: ReactNode }) {
  const { leaving, close } = useExit(onClose, 240), ref = useRef<HTMLDivElement>(null)
  useEsc(close); useFocusTrap(ref)
  const bottom = side === 'bottom'
  const style = bottom ? { left: 0, right: 0, bottom: 0, maxHeight: '82vh', borderRadius: '24px 24px 0 0' } : { top: 8, bottom: 8, [side]: 8, width: `min(${width}px, calc(100vw - 16px))` }
  const exitT = bottom ? 'translateY(105%)' : side === 'right' ? 'translateX(105%)' : 'translateX(-105%)'
  return createPortal(
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) close() }} style={{ opacity: leaving ? 0 : 1, transition: 'opacity .24s' }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Drawer'} tabIndex={-1} className="glass-deep fixed flex flex-col outline-none" style={{ ...style, animation: `${bottom ? 'slideU' : side === 'right' ? 'slideR' : 'slideL'} .34s cubic-bezier(.23,1,.32,1)`, transform: leaving ? exitT : undefined, transition: 'transform .24s cubic-bezier(.23,1,.32,1)' } as React.CSSProperties}>
        {bottom && <div className="mx-auto mt-2 h-1 w-10 rounded-full" style={{ background: 'rgba(var(--gc),.35)' }} />}
        {header ?? (title && <header className="flex items-center gap-3 px-5 pt-4 pb-2"><h2 className="text-base font-bold flex-1">{title}</h2><Button v="ghost" icon size="sm" onClick={close} aria-label="Close drawer" data-close><X size={16} /></Button></header>)}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>, document.body)
}

/* ---------- Anchored popover ---------- */
export function Popover({ trigger, children, align = 'start', width, className }: { trigger: ReactNode; children: (close: () => void) => ReactNode; align?: 'start' | 'end'; width?: number | 'trigger'; className?: string }) {
  const [open, setOpen] = useState(false), [pos, setPos] = useState<{ x: number; y: number; w: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null), pop = useRef<HTMLDivElement>(null)
  const toggle = () => { if (open) return setOpen(false); const r = ref.current!.getBoundingClientRect(); setPos({ x: r.left, y: r.bottom + 6, w: r.width }); setOpen(true) }
  useLayoutEffect(() => {
    if (!open || !pop.current || !pos || !ref.current) return
    const p = pop.current.getBoundingClientRect(), r = ref.current.getBoundingClientRect()
    let x = align === 'end' ? r.right - p.width : r.left, y = r.bottom + 6
    x = Math.max(8, Math.min(x, innerWidth - p.width - 8)); if (y + p.height > innerHeight - 8) y = Math.max(8, r.top - p.height - 6)
    if (x !== pos.x || y !== pos.y) setPos({ ...pos, x, y })
  }, [open, align]) // eslint-disable-line
  useEffect(() => {
    if (!open) return
    const d = (e: MouseEvent) => { if (!pop.current?.contains(e.target as Node) && !ref.current?.contains(e.target as Node)) setOpen(false) }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const s = () => setOpen(false)
    document.addEventListener('mousedown', d); document.addEventListener('keydown', k); window.addEventListener('resize', s)
    return () => { document.removeEventListener('mousedown', d); document.removeEventListener('keydown', k); window.removeEventListener('resize', s) }
  }, [open])
  return (
    <>
      <span ref={ref} onClick={toggle} className="inline-flex" aria-haspopup="true" aria-expanded={open}>{trigger}</span>
      {open && pos && createPortal(
        <div ref={pop} className={cn('glass-deep fixed z-[90] anim-menu p-1.5', className)} style={{ left: pos.x, top: pos.y, minWidth: width === 'trigger' ? pos.w : width, maxWidth: 'calc(100vw - 16px)', borderRadius: 16 }}>{children(() => setOpen(false))}</div>, document.body)}
    </>
  )
}

/* ---------- Menus ---------- */
export type MenuItem = { sep: true } | { label: string; header: true } | { label: string; icon?: ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean; kbd?: string; children?: MenuItem[]; checked?: boolean; header?: false; sep?: false }
const isAct = (i: MenuItem): i is Extract<MenuItem, { icon?: ReactNode }> => !('sep' in i && i.sep) && !('header' in i && i.header)

export function MenuList({ items, onDone, nested }: { items: MenuItem[]; onDone: () => void; nested?: boolean }) {
  const acts = items.map((it, i) => (isAct(it) && !it.disabled ? i : -1)).filter(i => i >= 0)
  const [idx, setIdx] = useState(-1), [sub, setSub] = useState(-1), ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!nested) ref.current?.focus() }, [nested])
  const key = (e: React.KeyboardEvent) => {
    const p = acts.indexOf(idx)
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(acts[(p + 1) % acts.length]) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(acts[(p - 1 + acts.length) % acts.length]) }
    else if (e.key === 'ArrowRight') { const it = items[idx]; if (it && isAct(it) && it.children) { e.preventDefault(); setSub(idx) } }
    else if (e.key === 'ArrowLeft' && nested) { e.preventDefault(); e.stopPropagation(); (ref.current?.closest('[data-parent]') as HTMLElement | null)?.focus() }
    else if (e.key === 'Enter' || e.key === ' ') { const it = items[idx]; if (it && isAct(it)) { e.preventDefault(); if (it.children) setSub(idx); else { it.onClick?.(); onDone() } } }
  }
  return (
    <div ref={ref} role="menu" tabIndex={-1} onKeyDown={key} className="outline-none min-w-[200px]" data-parent>
      {items.map((it, i) => {
        if ('sep' in it && it.sep) return <div key={i} className="menu-sep" role="separator" />
        if ('header' in it && it.header) return <div key={i} className="menu-label">{it.label}</div>
        if (!isAct(it)) return null
        return (
          <div key={i} className="relative" onMouseEnter={() => { setIdx(i); setSub(it.children ? i : -1) }}>
            <button role="menuitem" disabled={it.disabled} className={cn('menu-item', idx === i && 'active', it.danger && 'danger')} aria-haspopup={it.children ? 'menu' : undefined}
              onClick={() => { if (it.children) setSub(i); else { it.onClick?.(); onDone() } }}>
              <span className="w-4 grid place-items-center opacity-80 shrink-0">{it.checked ? <Check size={14} /> : it.icon}</span>
              <span className="flex-1">{it.label}</span>
              {it.kbd && <span className="faint text-[10px] tnum">{it.kbd}</span>}
              {it.children && <ChevronRight size={13} className="opacity-60" />}
            </button>
            {it.children && sub === i && <SubMenu items={it.children} onDone={onDone} />}
          </div>
        )
      })}
    </div>
  )
}
function SubMenu({ items, onDone }: { items: MenuItem[]; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null), [flip, setFlip] = useState(false), [up, setUp] = useState(0)
  useLayoutEffect(() => { const r = ref.current!.getBoundingClientRect(); if (r.right > innerWidth - 8) setFlip(true); if (r.bottom > innerHeight - 8) setUp(r.bottom - innerHeight + 12) }, [])
  return <div ref={ref} className="glass-deep absolute z-10 p-1.5 anim-menu max-h-[60vh] overflow-y-auto" style={{ top: -6 - up, [flip ? 'right' : 'left']: 'calc(100% + 2px)', borderRadius: 14 }}><MenuList items={items} onDone={onDone} nested /></div>
}
export function ContextMenu({ x, y, items, onClose, header }: { x: number; y: number; items: MenuItem[]; onClose: () => void; header?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null), [pos, setPos] = useState({ x, y })
  useLayoutEffect(() => { const r = ref.current!.getBoundingClientRect(); setPos({ x: Math.max(8, Math.min(x, innerWidth - r.width - 8)), y: Math.max(8, Math.min(y, innerHeight - r.height - 8)) }) }, [x, y])
  useEffect(() => {
    const d = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', d, true); document.addEventListener('keydown', k); window.addEventListener('resize', onClose); window.addEventListener('blur', onClose)
    document.addEventListener('contextmenu', d, true)
    return () => { document.removeEventListener('mousedown', d, true); document.removeEventListener('keydown', k); window.removeEventListener('resize', onClose); window.removeEventListener('blur', onClose); document.removeEventListener('contextmenu', d, true) }
  }, [onClose])
  return createPortal(<div ref={ref} className="glass-deep fixed z-[95] p-1.5 anim-menu max-h-[calc(100vh-16px)] overflow-y-auto" style={{ left: pos.x, top: pos.y, borderRadius: 16, minWidth: 220 }} onContextMenu={e => e.preventDefault()}>{header}<MenuList items={items} onDone={onClose} /></div>, document.body)
}
export function Dropdown({ trigger, items, align }: { trigger: ReactNode; items: MenuItem[]; align?: 'start' | 'end' }) {
  return <Popover trigger={trigger} align={align}>{close => <MenuList items={items} onDone={close} />}</Popover>
}

/* ---------- Tooltip ---------- */
export function Tooltip({ text, children, side = 'top' }: { text: ReactNode; children: ReactNode; side?: 'top' | 'bottom' }) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null), ref = useRef<HTMLSpanElement>(null), id = useRef('tt' + Math.random().toString(36).slice(2, 7))
  const show = () => { const r = ref.current!.getBoundingClientRect(); setP({ x: r.left + r.width / 2, y: side === 'top' ? r.top - 8 : r.bottom + 8 }) }
  return (
    <span ref={ref} className="inline-flex" onMouseEnter={show} onMouseLeave={() => setP(null)} onFocus={show} onBlur={() => setP(null)} aria-describedby={p ? id.current : undefined}>
      {children}
      {p && createPortal(<div id={id.current} role="tooltip" className="glass-deep fixed z-[99] px-2.5 py-1.5 text-[11px] font-semibold pointer-events-none anim-in" style={{ left: p.x, top: p.y, transform: `translate(-50%, ${side === 'top' ? '-100%' : '0'})`, borderRadius: 10, whiteSpace: 'nowrap' }}>{text}</div>, document.body)}
    </span>
  )
}

/* ---------- Toasts (global) ---------- */
export function Toaster() {
  const toasts = useStore(s => s.toasts), dismiss = useStore(s => s.dismissToast)
  const ic = { info: <Info size={16} />, ok: <CheckCircle2 size={16} />, warn: <AlertTriangle size={16} />, bad: <XCircle size={16} /> }
  const col = { info: 'var(--info)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' }
  return createPortal(
    <div className="fixed z-[120] bottom-20 md:bottom-5 right-3 left-3 sm:left-auto flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
      {toasts.map(t => (
        <Glass key={t.id} m="deep" className="pointer-events-auto flex gap-3 p-3 pr-2 w-full sm:w-[340px]" style={{ animation: 'toastIn .3s cubic-bezier(.23,1,.32,1)' }} role="status">
          <span style={{ color: col[t.level] }} className="mt-0.5">{ic[t.level]}</span>
          <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold">{t.title}</div>{t.body && <div className="text-xs muted">{t.body}</div>}{t.simulated && <span className="badge info mt-1.5"><FlaskConical size={10} />Simulated</span>}</div>
          <Button v="ghost" icon size="sm" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X size={14} /></Button>
        </Glass>
      ))}
    </div>, document.body)
}

/* ---------- Wizard ---------- */
export function Wizard({ steps, onFinish }: { steps: { title: string; body: ReactNode; valid?: boolean }[]; onFinish: () => void }) {
  const [i, setI] = useState(0)
  return (
    <div>
      <ol className="flex items-center gap-2 mb-4">{steps.map((s, k) => <li key={k} className="flex items-center gap-2 flex-1"><span className={cn('w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold border', k <= i ? 'text-white' : 'muted')} style={k <= i ? { background: 'var(--accent)', borderColor: 'transparent' } : { borderColor: 'rgba(var(--gc),.3)' }}>{k < i ? <Check size={12} /> : k + 1}</span><span className={cn('text-xs font-semibold hidden sm:block', k > i && 'muted')}>{s.title}</span>{k < steps.length - 1 && <span className="h-px flex-1" style={{ background: 'rgba(var(--gc),.2)' }} />}</li>)}</ol>
      <div className="min-h-[96px]">{steps[i].body}</div>
      <div className="flex justify-between mt-4"><Button size="sm" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button><Button size="sm" v="primary" disabled={steps[i].valid === false} onClick={() => i === steps.length - 1 ? onFinish() : setI(i + 1)}>{i === steps.length - 1 ? 'Finish' : 'Next'}</Button></div>
    </div>
  )
}
