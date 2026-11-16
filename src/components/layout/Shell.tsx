import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Gamepad2, Boxes, Wallet, Users, Activity, CalendarDays, Settings, Palette, Bell, Search, PanelLeftClose, PanelLeft, Menu, FlaskConical, Monitor, UserRound, Command, CornerDownLeft, Sun, Moon, Check } from 'lucide-react'
import { useStore, statusColor } from '../../store/useStore'
import { Avatar, Badge, Button, Glass } from '../ui/core'
import { Modal, Popover, Drawer } from '../ui/overlays'
import { cn } from '../../lib/utils'

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard }, { to: '/cafe', label: 'Cafe & Floor', icon: Gamepad2 }, { to: '/stock', label: 'Inventory', icon: Boxes },
  { to: '/finance', label: 'Finance', icon: Wallet }, { to: '/members', label: 'Members', icon: Users }, { to: '/monitoring', label: 'Monitoring', icon: Activity },
  { to: '/events', label: 'Events', icon: CalendarDays }, { to: '/settings', label: 'Settings', icon: Settings },
]

export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <div className="orb a" /><div className="orb b" /><div className="orb c" />
      <svg className="wave" viewBox="0 0 1440 220" preserveAspectRatio="none"><path d="M0 120 Q180 40 360 120 T720 120 T1080 120 T1440 120 V220 H0Z" fill="var(--accent)" opacity=".18" /><path d="M0 150 Q180 90 360 150 T720 150 T1080 150 T1440 150 V220 H0Z" fill="var(--accent2)" opacity=".16" /></svg>
    </div>
  )
}

function NavItems({ collapsed, onGo }: { collapsed?: boolean; onGo?: () => void }) {
  const issues = useStore(s => s.issues.filter(i => !i.resolved).length)
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(n => (
        <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={onGo} title={collapsed ? n.label : undefined}
          className={({ isActive }) => cn('focus-ring relative flex items-center gap-3 rounded-xl h-10 text-[13px] font-semibold transition-all duration-200', collapsed ? 'justify-center px-0' : 'px-3', isActive ? 'text-white' : 'muted hover:bg-white/10')}
          style={({ isActive }) => isActive ? { background: 'linear-gradient(180deg,color-mix(in srgb,var(--accent) 85%,#fff),color-mix(in srgb,var(--accent) 62%,#000))', boxShadow: '0 6px 20px color-mix(in srgb,var(--accent) 38%,transparent), inset 0 1px 0 rgba(255,255,255,.4)' } : undefined}>
          <n.icon size={18} />{!collapsed && <span className="flex-1">{n.label}</span>}
          {n.to === '/monitoring' && issues > 0 && (collapsed ? <i className="absolute top-1.5 right-2 w-2 h-2 rounded-full" style={{ background: 'var(--bad)' }} /> : <span className="badge bad !h-4 !px-1.5">{issues}</span>)}
        </NavLink>
      ))}
    </nav>
  )
}
export function Sidebar() {
  const c = useStore(s => s.sidebarCollapsed), set = useStore(s => s.set)
  const nav = useNavigate()
  return (
    <aside className={cn('hidden md:flex flex-col glass !rounded-none !border-y-0 !border-l-0 z-20 transition-[width] duration-300 shrink-0', c ? 'w-[68px]' : 'w-[232px]')} style={{ transitionTimingFunction: 'cubic-bezier(.23,1,.32,1)' }}>
      <div className={cn('flex items-center gap-3 h-16 px-4', c && 'justify-center px-0')}>
        <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0 border border-white/30" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))', boxShadow: '0 4px 16px color-mix(in srgb,var(--accent) 50%,transparent)' }}><Gamepad2 size={18} color="#fff" /></div>
        {!c && <div className="leading-tight"><div className="text-sm font-bold tracking-tight">Esports Lounge</div><div className="text-[10px] faint font-semibold tracking-widest uppercase">Control Center</div></div>}
      </div>
      <div className="px-3 flex-1 overflow-y-auto py-2"><NavItems collapsed={c} /></div>
      <div className="p-3 flex flex-col gap-2">
        {!c && <button onClick={() => nav('/ui-showcase')} className="btn !justify-start"><FlaskConical size={15} />UI Showcase</button>}
        {c && <Button icon v="ghost" onClick={() => nav('/ui-showcase')} aria-label="UI Showcase"><FlaskConical size={16} /></Button>}
        <Button v="ghost" icon={c} onClick={() => set({ sidebarCollapsed: !c })} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}>{c ? <PanelLeft size={16} /> : <><PanelLeftClose size={16} />Collapse</>}</Button>
      </div>
    </aside>
  )
}
export function MobileNav() {
  const [more, setMore] = useState(false), loc = useLocation(), nav = useNavigate()
  useEffect(() => setMore(false), [loc.pathname])
  const main = NAV.slice(0, 4)
  return (
    <>
      <nav className="md:hidden fixed bottom-2 left-2 right-2 z-30 glass-deep !rounded-2xl flex items-center justify-around p-1.5" aria-label="Primary" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        {main.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl text-[10px] font-semibold', isActive ? 'text-white' : 'muted')} style={({ isActive }) => isActive ? { background: 'var(--accent)' } : undefined}><n.icon size={18} />{n.label.split(' ')[0]}</NavLink>)}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl text-[10px] font-semibold muted" aria-label="More navigation"><Menu size={18} />More</button>
      </nav>
      <Drawer open={more} onClose={() => setMore(false)} side="left" width={300} title="Navigation">
        <div className="p-4 flex flex-col gap-3"><NavItems onGo={() => setMore(false)} />
          <button className="btn" onClick={() => { setMore(false); nav('/ui-showcase') }}><FlaskConical size={15} />UI Showcase</button></div>
      </Drawer>
    </>
  )
}

export function Clock() {
  const [n, setN] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setN(new Date()), 1000); return () => clearInterval(t) }, [])
  return <div className="hidden lg:flex flex-col items-end leading-tight"><span className="tnum text-[13px] font-semibold">{n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><span className="text-[10px] faint">{n.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
}

export function NotificationCenter() {
  const notices = useStore(s => s.notices), set = useStore(s => s.set)
  const unread = notices.filter(n => !n.read).length
  const col = { info: 'var(--info)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' }
  return (
    <Popover align="end" width={340} trigger={<Button icon v="ghost" aria-label={`Notifications (${unread} unread)`} className="relative"><Bell size={17} />{unread > 0 && <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full text-[9px] font-bold grid place-items-center text-white" style={{ background: 'var(--bad)' }}>{unread}</span>}</Button>}>
      {() => (
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between px-2.5 py-2"><span className="text-sm font-bold">Notifications</span><Button size="sm" v="ghost" onClick={() => set({ notices: notices.map(n => ({ ...n, read: true })) })}><Check size={13} />Mark all read</Button></div>
          {notices.map(n => <div key={n.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-white/5"><i className="dot mt-1.5" style={{ background: col[n.level], opacity: n.read ? .35 : 1 }} /><div className="min-w-0"><div className="text-[13px] font-semibold">{n.title}</div>{n.body && <div className="text-xs muted">{n.body}</div>}<div className="text-[10px] faint tnum mt-0.5">{new Date(n.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div>)}
        </div>)}
    </Popover>
  )
}

export function Header() {
  const set = useStore(s => s.set), shift = useStore(s => s.shift), a = useStore(s => s.appearance), setA = useStore(s => s.setAppearance), role = useStore(s => s.role)
  const nav = useNavigate(), loc = useLocation()
  const title = NAV.find(n => n.to === loc.pathname)?.label ?? (loc.pathname === '/ui-showcase' ? 'UI Showcase' : '')
  return (
    <header className="glass !rounded-none !border-x-0 !border-t-0 h-16 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 z-20 shrink-0">
      <div className="md:hidden w-8 h-8 rounded-lg grid place-items-center border border-white/30" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}><Gamepad2 size={16} color="#fff" /></div>
      <h1 className="font-bold text-[15px] md:hidden truncate">{title}</h1>
      <button className="hidden sm:flex items-center gap-2.5 glass-lite !rounded-xl px-3 h-9 flex-1 max-w-md text-left muted text-[13px] focus-ring" onClick={() => set({ commandOpen: true })} aria-label="Open command search">
        <Search size={14} /><span className="flex-1 truncate">Search PCs, members, pages…</span><kbd className="badge !h-5 tnum"><Command size={10} />K</kbd>
      </button>
      <div className="flex-1 sm:hidden" />
      <button className={cn('hidden xl:flex items-center gap-2 glass-lite !rounded-xl px-3 h-9 text-xs focus-ring')} onClick={() => nav('/finance')} aria-label="Shift status">
        <span className="dot live" style={{ background: shift.open ? 'var(--ok)' : 'var(--bad)', color: shift.open ? 'var(--ok)' : 'var(--bad)' }} /><span className="font-semibold">{shift.open ? `Shift open · ${shift.employee}` : 'No active shift'}</span>
      </button>
      <Button icon v="ghost" className="sm:!hidden" aria-label="Search" onClick={() => set({ commandOpen: true })}><Search size={17} /></Button>
      <Button icon v="ghost" aria-label={`Switch to ${a.theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setA({ theme: a.theme === 'dark' ? 'light' : 'dark' })}>{a.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</Button>
      <Button icon v="ghost" aria-label="Appearance Studio" onClick={() => set({ studioOpen: true })}><Palette size={17} /></Button>
      <NotificationCenter />
      <Clock />
      <Popover align="end" trigger={<button className="flex items-center gap-2 focus-ring rounded-full" aria-label="User profile"><Avatar name={shift.employee} size={34} /></button>}>
        {close => (<div className="w-56 p-1"><div className="flex items-center gap-2 p-2"><Avatar name={shift.employee} size={36} /><div><div className="text-[13px] font-semibold">{shift.employee}</div><Badge tone="acc">{role}</Badge></div></div><hr className="hair my-1" />
          {(['Admin', 'Manager', 'Cashier'] as const).map(r => <button key={r} className="menu-item" onClick={() => { set({ role: r }); useStore.getState().toast({ title: `Role switched to ${r}`, body: r === 'Cashier' ? 'Restart/Shutdown/Force-logout are now blocked' : 'Full permissions', level: 'info' }); close() }}><span className="w-4">{role === r && <Check size={14} />}</span>Act as {r}</button>)}</div>)}
      </Popover>
    </header>
  )
}

/* ---------- Command palette ---------- */
export { NavItems }
export function CommandPalette() {
  const open = useStore(s => s.commandOpen), set = useStore(s => s.set), nav = useNavigate()
  const layout = useStore(s => s.layout.stations), live = useStore(s => s.live), members = useStore(s => s.members)
  const [q, setQ] = useState(''), [scope, setScope] = useState<'all' | 'pc' | 'member' | 'page'>('all'), [i, setI] = useState(0)
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); set({ commandOpen: true }) } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [set])
  const close = () => { set({ commandOpen: false }); setQ(''); setI(0) }
  const results = useMemo(() => {
    const s = q.toLowerCase(), r: { key: string; icon: React.ReactNode; title: string; sub: string; run: () => void; kind: string }[] = []
    if (scope === 'all' || scope === 'page') NAV.concat([{ to: '/ui-showcase', label: 'UI Showcase', icon: FlaskConical }]).filter(n => n.label.toLowerCase().includes(s)).forEach(n => r.push({ key: n.to, icon: <n.icon size={15} />, title: n.label, sub: 'Page', kind: 'page', run: () => nav(n.to) }))
    if (scope === 'all' || scope === 'pc') layout.filter(p => (p.name + ' ' + (live[p.id]?.user ?? '')).toLowerCase().includes(s)).slice(0, s ? 12 : 4).forEach(p => r.push({ key: p.id, icon: <Monitor size={15} />, title: p.name, sub: `${live[p.id]?.status} · ${live[p.id]?.user ?? 'vacant'}`, kind: 'pc', run: () => { nav('/cafe'); set({ drawerId: p.id }) } }))
    if (scope === 'all' || scope === 'member') members.filter(m => (m.user + m.name).toLowerCase().includes(s)).slice(0, s ? 10 : 3).forEach(m => r.push({ key: m.id, icon: <UserRound size={15} />, title: m.user, sub: `${m.tier} · $${m.wallet.toFixed(2)}`, kind: 'member', run: () => nav('/members') }))
    return r
  }, [q, scope, layout, live, members, nav, set])
  return (
    <Modal open={open} onClose={close} size="lg">
      <div className="-mx-1">
        <div className="flex items-center gap-2 mb-3"><Search size={16} className="muted" /><input data-autofocus className="field !border-0 !bg-transparent !shadow-none !text-base" placeholder="Search PCs, members, pages…" aria-label="Search" value={q} onChange={e => { setQ(e.target.value); setI(0) }}
          onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setI(x => Math.min(results.length - 1, x + 1)) } else if (e.key === 'ArrowUp') { e.preventDefault(); setI(x => Math.max(0, x - 1)) } else if (e.key === 'Enter' && results[i]) { results[i].run(); close() } }} /></div>
        <div className="flex gap-1.5 mb-2">{(['all', 'pc', 'member', 'page'] as const).map(s => <Button key={s} size="sm" on={scope === s} onClick={() => setScope(s)}>{{ all: 'All', pc: 'Quick PC', member: 'Members', page: 'Pages' }[s]}</Button>)}</div>
        <div className="max-h-[50vh] overflow-y-auto" role="listbox">
          {results.map((r, k) => <button key={r.kind + r.key} role="option" aria-selected={k === i} onMouseEnter={() => setI(k)} onClick={() => { r.run(); close() }} className={cn('menu-item !py-2.5', k === i && 'active')}><span className="opacity-80">{r.icon}</span><span className="flex-1">{r.title}</span><span className="faint text-xs">{r.sub}</span>{k === i && <CornerDownLeft size={12} className="faint" />}</button>)}
          {!results.length && <div className="p-6 text-center sub">No matches for “{q}”</div>}
        </div>
      </div>
    </Modal>
  )
}
export const _g = Glass
export const _sc = statusColor
