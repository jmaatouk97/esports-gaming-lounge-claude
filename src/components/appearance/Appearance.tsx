import { Sun, Moon, RotateCcw, Check } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PRESETS, FONTS, DEFAULT_OPTICS, type Optics } from '../../lib/presets'
import { Button, Slider, Tabs } from '../ui/core'
import { Drawer } from '../ui/overlays'
import { cn } from '../../lib/utils'

export function AppearancePanel() {
  const a = useStore(s => s.appearance), setA = useStore(s => s.setAppearance)
  const setOpt = (k: keyof Optics, v: number) => setA({ optics: { ...a.optics, [k]: v } })
  const optics: [keyof Optics, string][] = [['strength', 'Glass Strength'], ['bezel', 'Bezel'], ['dispersion', 'Dispersion'], ['frost', 'Frost'], ['blur', 'Blur'], ['specular', 'Specular']]
  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <h3 className="lbl">Theme</h3>
        <Tabs value={a.theme} onChange={v => setA({ theme: v })} tabs={[{ id: 'light', label: 'Light', icon: <Sun size={14} /> }, { id: 'dark', label: 'Dark', icon: <Moon size={14} /> }]} />
      </section>
      <section>
        <h3 className="lbl">Typography</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FONTS.map((f, i) => (
            <button key={f.name} onClick={() => setA({ font: i })} aria-pressed={a.font === i} className={cn('inset-glass text-left p-3 transition-all focus-ring', a.font === i && '!border-[var(--accent)]')} style={a.font === i ? { background: 'color-mix(in srgb,var(--accent) 16%,transparent)' } : undefined}>
              <div className="text-lg leading-tight font-semibold" style={{ fontFamily: `${f.sans}, sans-serif` }}>Aa Quick fox</div>
              <div className="text-xs tnum" style={{ fontFamily: `${f.mono}, monospace` }}>01:42:15 · $24.50</div>
              <div className="text-[10px] faint mt-1 flex items-center gap-1">{a.font === i && <Check size={10} />}{f.name}</div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="lbl">Color presets · {PRESETS[a.preset].name}</h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p, i) => (
            <button key={p.name} onClick={() => setA({ preset: i })} aria-label={p.name} aria-pressed={a.preset === i} title={p.name} className={cn('rounded-xl p-1.5 border transition-all focus-ring hover:scale-[1.04]', a.preset === i ? 'border-[var(--accent)]' : 'border-white/15')} style={{ background: p.surface }}>
              <div className="h-8 rounded-lg relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}>{a.preset === i && <Check size={14} className="absolute inset-0 m-auto" color="#fff" style={{ filter: 'drop-shadow(0 1px 2px #000)' }} />}</div>
              <div className="text-[9px] font-semibold mt-1 truncate text-center" style={{ color: '#e8ecff' }}>{p.name}</div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-2"><h3 className="lbl !mb-0">Glass optics</h3><Button size="sm" v="ghost" onClick={() => setA({ optics: DEFAULT_OPTICS })}><RotateCcw size={13} />Reset</Button></div>
        <div className="flex flex-col gap-3">{optics.map(([k, l]) => <Slider key={k} label={l} value={a.optics[k]} onChange={v => setOpt(k, v)} />)}</div>
      </section>
    </div>
  )
}
export function AppearanceStudio() {
  const open = useStore(s => s.studioOpen), set = useStore(s => s.set)
  return <Drawer open={open} onClose={() => set({ studioOpen: false })} title="Appearance Studio" width={440}><AppearancePanel /></Drawer>
}
