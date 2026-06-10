import { Component, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import SideNav from './components/SideNav'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import SkillsPage from './pages/SkillsPage'
import { useAnalytics } from './hooks/useAnalytics'
import { API_URL } from './lib/api'
import { getFallbackPortfolioData, normalizePortfolioData } from './lib/portfolioData'

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

class SideNavErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('SideNav crashed:', error)
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-0 w-full items-center justify-center border-r border-white/8 bg-[#080e1c]/95 px-4 text-center text-sm text-slate-400">
          Navigation is temporarily unavailable.
        </div>
      )
    }

    return this.props.children
  }
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [portfolioData, setPortfolioData] = useState(() => getFallbackPortfolioData())

  // Analytics: fire pageview on every route change
  const { trackProjectView, trackContactClick } = useAnalytics(location.pathname)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadPortfolioData() {
      try {
        const res = await fetch(`${API_URL}/api/load`)
        const json = await res.json()
        if (!ignore && json.ok && json.data) {
          setPortfolioData(normalizePortfolioData(json.data))
        }
      } catch {
        // Keep static fallback data when the API is unavailable.
      }
    }

    loadPortfolioData()

    return () => {
      ignore = true
    }
  }, [])

  const currentTime = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)

  const isHome = location.pathname === '/'
  const sideNavResetKey = `${location.pathname}:${portfolioData?.profile?.name || 'fallback'}`

  return (
    <main className="ambient-bg relative flex h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute -right-32 top-0 h-[400px] w-[400px] rounded-full bg-indigo-500/8 blur-[80px]" />
        <div className="absolute bottom-0 left-1/2 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-sky-500/8 blur-[100px]" />
      </div>

      {/* Desktop SideNav (hidden on mobile) */}
      <div className="hidden md:flex h-screen sticky top-0">
        <SideNavErrorBoundary resetKey={sideNavResetKey}>
          <SideNav portfolioData={portfolioData} />
        </SideNavErrorBoundary>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <Motion.div
            className="fixed inset-0 z-50 flex md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <Motion.div
              className="relative z-10"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            >
              <SideNavErrorBoundary resetKey={sideNavResetKey}>
                <SideNav
                  portfolioData={portfolioData}
                  isDrawer
                  onClose={() => setIsMenuOpen(false)}
                  onNavigate={() => setIsMenuOpen(false)}
                />
              </SideNavErrorBoundary>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Top Bar (Mobile + Desktop) */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-md md:px-8 md:py-4 lg:px-12">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-200 shadow-[0_10px_28px_rgba(2,6,23,0.22)] transition hover:bg-white/10 hover:text-white md:hidden"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </button>
            {!isHome && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mr-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold tracking-[0.15em] text-white/70 uppercase transition hover:bg-white/10 hover:text-white md:py-2"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M6.5 1.5 3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            )}
            <h1 className="font-heading text-xs font-semibold tracking-[0.2em] text-white/40 uppercase md:text-sm md:tracking-[0.3em]">Portfolio</h1>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 md:gap-4 md:text-xs">
            <span className="hidden sm:inline">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</span>
            <span className="font-semibold text-slate-400">{currentTime}</span>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="page-scroll flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10 lg:px-12 xl:px-16">
          <div className="mx-auto min-h-full max-w-5xl flex flex-col">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Motion.div {...pageTransition} className="flex-1"><HomePage now={now} portfolioData={portfolioData} /></Motion.div>} />
                <Route path="/about" element={<Motion.div {...pageTransition} className="flex-1"><AboutPage portfolioData={portfolioData} /></Motion.div>} />
                <Route path="/projects" element={<Motion.div {...pageTransition} className="flex-1"><ProjectsPage portfolioData={portfolioData} trackProjectView={trackProjectView} /></Motion.div>} />
                <Route path="/skills" element={<Motion.div {...pageTransition} className="flex-1"><SkillsPage portfolioData={portfolioData} /></Motion.div>} />
                <Route path="/contact" element={<Motion.div {...pageTransition} className="flex-1"><ContactPage portfolioData={portfolioData} trackContactClick={trackContactClick} /></Motion.div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
