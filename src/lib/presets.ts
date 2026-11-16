export const PRESETS = [
  ['Liqui', '#6F9DFF', '#A5B4FC', '#1E202E'], ['Arctic', '#38BDF8', '#7DD3FC', '#162232'],
  ['Graphite', '#94A3B8', '#CBD5E1', '#1E242B'], ['Aurora', '#34D399', '#A78BFA', '#12262A'],
  ['Noir', '#F5F6FF', '#71717A', '#121215'], ['Crystal', '#22D3EE', '#F472B6', '#1B2432'],
  ['Nordic Cobalt', '#3B82F6', '#38BDF8', '#0F193B'], ['Tokyo Dusk', '#F43F5E', '#F59E0B', '#311042'],
  ['Emerald Lounge', '#10B981', '#14B8A6', '#0F2E28'], ['Solar Sand', '#EA580C', '#EAB308', '#291D18'],
  ['Velvet Iris', '#8B5CF6', '#D946EF', '#1E1B4B'], ['Monochrome Titanium', '#E2E8F0', '#94A3B8', '#18181B'],
  ['Cyber Pulse', '#06B6D4', '#EC4899', '#1E1035'], ['Synthwave Prism', '#22D3EE', '#A855F7', '#17153B'],
  ['Arcade Volt', '#2563EB', '#FACC15', '#0F172A'], ['Apex Racing', '#3B82F6', '#EF4444', '#111827'],
].map(([name, primary, secondary, surface]) => ({ name, primary, secondary, surface }))

export const FONTS = [
  { name: 'Inter + JetBrains Mono', sans: "'Inter'", mono: "'JetBrains Mono'" },
  { name: 'Plus Jakarta Sans + Geist Mono', sans: "'Plus Jakarta Sans'", mono: "'Geist Mono','JetBrains Mono'" },
  { name: 'Space Grotesk + Space Mono', sans: "'Space Grotesk'", mono: "'Space Mono'" },
  { name: 'Outfit + Fira Code', sans: "'Outfit'", mono: "'Fira Code'" },
  { name: 'DM Sans + IBM Plex Mono', sans: "'DM Sans'", mono: "'IBM Plex Mono'" },
  { name: 'Rajdhani + Share Tech Mono', sans: "'Rajdhani'", mono: "'Share Tech Mono'" },
]

export const DEFAULT_OPTICS = { strength: 50, bezel: 50, dispersion: 0, frost: 50, blur: 50, specular: 50 }
export type Optics = typeof DEFAULT_OPTICS

export interface Appearance { theme: 'dark' | 'light'; font: number; preset: number; optics: Optics }
export const DEFAULT_APPEARANCE: Appearance = { theme: 'dark', font: 0, preset: 0, optics: DEFAULT_OPTICS }

export function applyAppearance(a: Appearance) {
  const r = document.documentElement, p = PRESETS[a.preset], f = FONTS[a.font], o = a.optics
  r.dataset.theme = a.theme
  r.style.setProperty('--accent', p.primary); r.style.setProperty('--accent2', p.secondary); r.style.setProperty('--surface', p.surface)
  r.style.setProperty('--font-sans', `${f.sans}, system-ui, sans-serif`); r.style.setProperty('--font-mono', `${f.mono}, monospace`)
  const light = a.theme === 'light'
  r.style.setProperty('--blur', `${6 + (o.blur / 100) * 34}px`)
  r.style.setProperty('--g-alpha', String((light ? .25 : .03) + (o.frost / 100) * (light ? .35 : .09)))
  r.style.setProperty('--bezel', String(.04 + (o.bezel / 100) * .3))
  r.style.setProperty('--spec', String((o.specular / 100) * .45))
  r.style.setProperty('--disp', String((o.dispersion / 100) * .6))
  r.style.setProperty('--strength', String((o.strength / 100) * 1))
  r.style.setProperty('--shadow', String(.12 + (o.strength / 100) * .35))
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', light ? '#e8ecfb' : '#0b0d1a')
}
