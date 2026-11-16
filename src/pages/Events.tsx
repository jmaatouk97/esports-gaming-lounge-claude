import { useMemo, useState } from 'react'
import { Plus, CalendarCheck, Trophy, Users, DollarSign, Swords, Crown } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Badge, Button, Card, PageHeader, Tabs, Glass } from '../components/ui/core'
import { Calendar, DatePicker, TimePicker, Input, NumberInput, Select, TimelineScheduler, WeekScheduler, iso, parseISO, type Slot } from '../components/ui/forms'
import { Modal } from '../components/ui/overlays'
import { buildBracket } from '../services/mock'
import { money, uid } from '../lib/utils'
import type { Reservation, Tournament, Match } from '../store/types'

const TONE = { station: 'var(--accent)', vip: '#D946EF', console: '#10B981', arena: '#F43F5E' }
const TARGETS = ['Main Hall ×8', 'VIP Room', 'Esports Arena', 'CON-1', 'CON-2', 'CON-3', 'CON-4', 'Private Room A', 'Private Room B']

export function Bracket({ t, onPick }: { t: Tournament; onPick: (m: Match) => void }) {
  const cols = (b: 'W' | 'L' | 'GF') => { const ms = t.matches.filter(m => m.bracket === b), rs = [...new Set(ms.map(m => m.round))].sort(); return rs.map(r => ms.filter(m => m.round === r)) }
  const Col = ({ ms, title }: { ms: Match[]; title: string }) => (
    <div className="flex flex-col justify-around gap-3 min-w-[160px]"><div className="text-[10px] font-bold uppercase tracking-wider faint text-center">{title}</div>
      {ms.map(m => <button key={m.id} onClick={() => onPick(m)} disabled={!m.a || !m.b} className="glass-lite !rounded-xl overflow-hidden text-left focus-ring disabled:opacity-60 hover:-translate-y-0.5 transition-transform" aria-label={`Match ${m.id}`}>
        {([['a', m.sa], ['b', m.sb]] as const).map(([k, sc]) => <div key={k} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs border-b border-white/10 last:border-0" style={m.winner && m.winner === m[k] ? { background: 'color-mix(in srgb,var(--accent) 22%,transparent)', fontWeight: 700 } : undefined}><span className="truncate">{m[k] ?? <span className="faint">TBD</span>}</span><span className="tnum">{m.winner ? sc : ''}</span></div>)}</button>)}</div>)
  return (
    <div className="overflow-x-auto pb-2"><div className="flex gap-5 min-w-max">
      {cols('W').map((ms, i) => <Col key={'w' + i} ms={ms} title={i === cols('W').length - 1 ? 'Final' : i === cols('W').length - 2 ? 'Semis' : `Round ${i + 1}`} />)}
      {t.format === 'double' && <><div className="w-px self-stretch" style={{ background: 'rgba(var(--gc),.2)' }} />{cols('L').map((ms, i) => <Col key={'l' + i} ms={ms} title={`Losers R${i + 1}`} />)}{cols('GF').map((ms, i) => <Col key={'g' + i} ms={ms} title="Grand Final" />)}</>}
    </div></div>
  )
}

export default function Events() {
  const s = useStore(), [tab, setTab] = useState<'res' | 'tour'>('res'), [view, setView] = useState<'month' | 'week' | 'timeline'>('timeline')
  const [date, setDate] = useState(iso(new Date())), [edit, setEdit] = useState<Reservation | null>(null), [tid, setTid] = useState(s.tournaments[0].id), [match, setMatch] = useState<Match | null>(null), [sc, setSc] = useState<[number, number]>([0, 0]), [team, setTeam] = useState(''), [terr, setTerr] = useState('')
  const res = s.reservations, dayRes = res.filter(r => r.date === date)
  const marks = useMemo(() => res.reduce<Record<string, number>>((a, r) => ({ ...a, [r.date]: (a[r.date] ?? 0) + 1 }), {}), [res])
  const upd = (id: string, p: Partial<Reservation>) => s.set({ reservations: s.reservations.map(r => r.id === id ? { ...r, ...p } : r) })
  const slotsDay: Slot[] = dayRes.map(r => ({ id: r.id, row: r.target, start: r.start, hours: r.hours, title: `${r.who}${r.checkedIn ? ' ✓' : ''}`, tone: TONE[r.kind] }))
  const rows = [...new Set([...TARGETS.slice(0, 7), ...dayRes.map(r => r.target)])]
  const wk = parseISO(date), wkStart = new Date(wk); wkStart.setDate(wk.getDate() - wk.getDay())
  const weekSlots: Slot[] = res.flatMap(r => { const d = parseISO(r.date), diff = Math.round((+d - +wkStart) / 86400000); return diff >= 0 && diff < 7 ? [{ id: r.id, row: r.target, day: diff, start: r.start, hours: r.hours, title: r.who, tone: TONE[r.kind] }] : [] })
  const tour = s.tournaments.find(t => t.id === tid)!
  const updT = (t: Tournament) => s.set({ tournaments: s.tournaments.map(x => x.id === t.id ? t : x) })
  const newRes = () => setEdit({ id: '', who: '', target: 'VIP Room', kind: 'vip', date, start: 18, hours: 2, deposit: 20, paid: false, checkedIn: false })
  const saveRes = () => { if (!edit) return; if (!edit.who.trim()) { setTerr('Name is required'); return } const conflict = res.some(r => r.id !== edit.id && r.date === edit.date && r.target === edit.target && edit.start < r.start + r.hours && r.start < edit.start + edit.hours); if (conflict) { setTerr(`${edit.target} is already booked in that window`); return }
    const kind: Reservation['kind'] = edit.target.includes('VIP') ? 'vip' : edit.target.startsWith('CON') ? 'console' : edit.target.includes('Arena') ? 'arena' : 'station'
    s.set({ reservations: edit.id ? res.map(r => r.id === edit.id ? { ...edit, kind } : r) : [...res, { ...edit, kind, id: uid() }] }); s.toast({ title: edit.id ? 'Reservation updated' : 'Reservation booked', body: `${edit.who} · ${edit.target}`, level: 'ok' }); setEdit(null); setTerr('') }
  return (
    <div className="page">
      <PageHeader title="Reservations & Tournaments" sub="Bookings, deposits, brackets and prize pools" actions={<Tabs value={tab} onChange={setTab} tabs={[{ id: 'res', label: 'Reservations', icon: <CalendarCheck size={14} /> }, { id: 'tour', label: 'Tournaments', icon: <Trophy size={14} /> }]} />} />
      {tab === 'res' ? <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-3">
          <Glass className="p-3"><Calendar value={date} onPick={setDate} marks={marks} /></Glass>
          <Card title={`Bookings · ${parseISO(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`} right={<Button size="sm" v="primary" onClick={newRes}><Plus size={13} />Book</Button>}>
            {dayRes.length ? <ul className="flex flex-col gap-2">{dayRes.sort((a, b) => a.start - b.start).map(r => <li key={r.id} className="inset-glass p-2.5"><div className="flex justify-between items-start gap-2"><div className="min-w-0"><button className="font-semibold text-[13px] hover:underline truncate block" onClick={() => { setTerr(''); setEdit(r) }}>{r.who}</button><div className="text-[11px] muted">{r.target} · <span className="tnum">{r.start}:00–{r.start + r.hours}:00</span></div></div>{r.checkedIn ? <Badge tone="ok">Checked in</Badge> : <Button size="sm" onClick={() => { upd(r.id, { checkedIn: true }); s.logActivity('checkin', `${r.who} checked in · ${r.target}`); s.toast({ title: 'Checked in', body: r.who, level: 'ok' }) }}>Check in</Button>}</div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]"><Badge tone={r.paid ? 'ok' : 'warn'}>{r.deposit ? `Deposit ${money(r.deposit)}` : 'No deposit'}{r.deposit ? (r.paid ? ' · paid' : ' · due') : ''}</Badge>{!r.paid && r.deposit > 0 && <button className="underline faint" onClick={() => upd(r.id, { paid: true })}>Mark paid</button>}</div></li>)}</ul> : <p className="sub py-3 text-center">Nothing booked this day.</p>}
          </Card>
        </div>
        <Card title="Schedule" right={<Tabs size="sm" value={view} onChange={setView} tabs={[{ id: 'timeline', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]} />}>
          {view === 'timeline' && <><TimelineScheduler rows={rows} slots={slotsDay} onPick={x => setEdit(res.find(r => r.id === x.id)!)} onMove={(id, row, start) => { const r = res.find(x => x.id === id)!; const conflict = res.some(o => o.id !== id && o.date === r.date && o.target === row && start < o.start + o.hours && o.start < start + r.hours); if (conflict) { s.toast({ title: 'Slot already taken', body: row, level: 'warn' }); return } upd(id, { target: row, start }); s.toast({ title: 'Booking moved', body: `${r.who} → ${row} at ${start}:00`, level: 'ok' }) }} /><p className="text-[11px] faint mt-2">Drag a booking to another row or hour to reschedule.</p></>}
          {view === 'week' && <WeekScheduler start={wkStart} slots={weekSlots} onPick={x => setEdit(res.find(r => r.id === x.id)!)} />}
          {view === 'month' && <Calendar big value={date} onPick={d => { setDate(d); setView('timeline') }} marks={marks} />}
        </Card>
      </div> : <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-3">
          {s.tournaments.map(t => <button key={t.id} onClick={() => setTid(t.id)} className={`glass p-4 text-left focus-ring ${t.id === tid ? '!border-[var(--accent)]' : ''}`}><div className="flex justify-between items-start"><div><div className="font-bold">{t.name}</div><div className="text-xs muted">{t.game}</div></div><Badge tone="acc">{t.format === 'single' ? 'Single elim.' : 'Double elim.'}</Badge></div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs"><div className="inset-glass p-1.5"><Crown size={13} className="mx-auto" style={{ color: 'var(--warn)' }} /><div className="tnum font-bold">{money(t.prize)}</div></div><div className="inset-glass p-1.5"><Users size={13} className="mx-auto muted" /><div className="tnum font-bold">{t.teams.length}/8</div></div><div className="inset-glass p-1.5"><DollarSign size={13} className="mx-auto muted" /><div className="tnum font-bold">{money(t.entry)}</div></div></div></button>)}
          <Card title="Team registration"><div className="flex gap-2 items-end"><div className="flex-1"><Input label="Team name" value={team} error={terr && tab === 'tour' ? terr : undefined} onChange={e => { setTeam(e.target.value); setTerr('') }} /></div><Button v="primary" onClick={() => { const n = team.trim(); if (!n) return setTerr('Enter a team name'); if (tour.teams.length >= 8) return setTerr('Bracket is full (8 teams)'); if (tour.teams.some(x => x.toLowerCase() === n.toLowerCase())) return setTerr('Team already registered'); const teams = [...tour.teams, n]; updT({ ...tour, teams, prize: tour.prize + Math.round(tour.entry * .5), matches: buildBracket(teams, tour.format) }); setTeam(''); s.toast({ title: `${n} registered`, body: `Entry ${money(tour.entry)} · prize pool +${money(Math.round(tour.entry * .5))}`, level: 'ok' }) }}>Add</Button></div>
            <div className="flex flex-wrap gap-1.5 mt-3">{tour.teams.map(t => <Badge key={t}>{t}</Badge>)}</div></Card>
        </div>
        <Card title={<span className="flex items-center gap-2"><Swords size={15} />{tour.name} · live bracket</span>} right={<Button size="sm" onClick={() => s.confirm('Reset bracket?', 'All scores in this tournament are cleared.', 'Reset', () => updT({ ...tour, matches: buildBracket(tour.teams, tour.format) }))}>Reset</Button>}>
          <Bracket t={tour} onPick={m => { setMatch(m); setSc([m.sa, m.sb]) }} />
          {(() => { const fin = tour.format === 'double' ? tour.matches.find(m => m.id === 'GF-0') : tour.matches.find(m => m.id === 'W3-0'); return fin?.winner ? <div className="mt-3 glass-tint glass !rounded-2xl p-4 flex items-center gap-3"><Crown style={{ color: 'var(--warn)' }} /><div><div className="text-xs muted">Champion</div><div className="font-bold text-lg">{fin.winner}</div></div><div className="ml-auto tnum font-bold">{money(tour.prize)}</div></div> : <p className="text-[11px] faint mt-2">Click a match with both teams to enter the score. Winners advance automatically.</p> })()}
        </Card>
      </div>}
      <Modal open={!!match} onClose={() => setMatch(null)} size="sm" title="Enter score" footer={<><Button onClick={() => setMatch(null)}>Cancel</Button><Button v="primary" onClick={() => { if (sc[0] === sc[1]) { s.toast({ title: 'Scores cannot tie', level: 'warn' }); return } s.setScore(tour.id, match!.id, sc[0], sc[1]); setMatch(null) }}>Save & advance</Button></>}>
        {match && <div className="grid grid-cols-2 gap-3"><NumberInput label={match.a ?? ''} value={sc[0]} max={99} onChange={v => setSc([v, sc[1]])} /><NumberInput label={match.b ?? ''} value={sc[1]} max={99} onChange={v => setSc([sc[0], v])} /></div>}</Modal>
      <Modal open={!!edit} onClose={() => { setEdit(null); setTerr('') }} title={edit?.id ? 'Edit reservation' : 'New reservation'} footer={<><Button onClick={() => { setEdit(null); setTerr('') }}>Cancel</Button>{edit?.id && <Button v="danger" onClick={() => { s.set({ reservations: res.filter(r => r.id !== edit.id) }); setEdit(null) }}>Cancel booking</Button>}<Button v="primary" onClick={saveRes}>Save</Button></>}>
        {edit && <div className="flex flex-col gap-3"><Input label="Booked by" value={edit.who} error={terr} onChange={e => { setEdit({ ...edit, who: e.target.value }); setTerr('') }} /><Select label="Station / room" value={edit.target} onChange={v => setEdit({ ...edit, target: v })} options={TARGETS.map(v => ({ value: v, label: v }))} />
          <div className="grid grid-cols-2 gap-3"><DatePicker label="Date" value={edit.date} onChange={v => setEdit({ ...edit, date: v })} /><TimePicker label="Start" value={`${String(edit.start).padStart(2, '0')}:00`} step={60} onChange={v => setEdit({ ...edit, start: +v.slice(0, 2) })} /></div>
          <div className="grid grid-cols-2 gap-3"><NumberInput label="Hours" value={edit.hours} min={1} max={12} onChange={v => setEdit({ ...edit, hours: v })} /><NumberInput label="Deposit" prefix="$" value={edit.deposit} step={5} max={1000} onChange={v => setEdit({ ...edit, deposit: v })} /></div></div>}</Modal>
    </div>
  )
}
