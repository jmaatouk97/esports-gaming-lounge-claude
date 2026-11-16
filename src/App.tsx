import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import { applyAppearance } from './lib/presets'
import { Ambient, Sidebar, Header, MobileNav, CommandPalette } from './components/layout/Shell'
import { AppearanceStudio } from './components/appearance/Appearance'
import { GlobalOverlays } from './components/floor/Overlays'
import { Toaster } from './components/ui/overlays'
import { Skeleton } from './components/ui/core'
import Overview from './pages/Overview'
import Cafe from './pages/Cafe'

const Stock = lazy(() => import('./pages/Stock')), Finance = lazy(() => import('./pages/Finance')), Members = lazy(() => import('./pages/Members')), Monitoring = lazy(() => import('./pages/Monitoring')),
  Events = lazy(() => import('./pages/Events')), Settings = lazy(() => import('./pages/Settings')), Showcase = lazy(() => import('./pages/Showcase'))

function Shell() {
  const appearance = useStore(s => s.appearance), tick = useStore(s => s.tick), loc = useLocation()
  useEffect(() => applyAppearance(appearance), [appearance])
  useEffect(() => { useStore.setState({ menu: null, drawerId: null, commandOpen: false }) }, [loc.pathname])
  useEffect(() => { let n = 0; const t = setInterval(() => tick(++n), 1000); return () => clearInterval(t) }, [tick])
  useEffect(() => { // simulated incoming alerts so the demo feels alive
    const t = setInterval(() => { const s = useStore.getState(); const ids = s.layout.stations; if (!ids.length) return; const p = ids[Math.floor(Math.random() * ids.length)]; s.logActivity(Math.random() > .5 ? 'checkin' : 'session', `${Math.random() > .5 ? 'Check-in' : 'Session tick'} · ${p.name} (simulated)`) }, 25000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="relative h-full flex">
      <Ambient />
      <Sidebar />
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 min-h-0 relative" key={loc.pathname}>
          <div className="h-full anim-in">
            <Suspense fallback={<div className="page"><Skeleton className="h-10 w-64 mb-4" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div></div>}>
              <Routes>
                <Route path="/" element={<Overview />} /><Route path="/cafe" element={<Cafe />} /><Route path="/stock" element={<Stock />} /><Route path="/finance" element={<Finance />} />
                <Route path="/members" element={<Members />} /><Route path="/monitoring" element={<Monitoring />} /><Route path="/events" element={<Events />} /><Route path="/settings" element={<Settings />} /><Route path="/ui-showcase" element={<Showcase />} /><Route path="*" element={<Overview />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      <MobileNav />
      <AppearanceStudio /><CommandPalette /><GlobalOverlays /><Toaster />
    </div>
  )
}
export default function App() { return <HashRouter><Shell /></HashRouter> }
