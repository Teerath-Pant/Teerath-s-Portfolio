import { useState, useEffect, useCallback, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002'
const API = `${API_BASE}/api/analytics`
const EMPTY_ANALYTICS = {
  selfFiltered: false,
  totalVisits: 0,
  uniqueVisitors: 0,
  topCountries: [],
  pageViews: [],
  projectsViewed: [],
  contactClicks: [],
  dailyChart: [],
}

// ── Theme color tokens ──
const C = {
  primary:   'var(--primary,   #4f8ef7)',
  secondary: 'var(--secondary, #818cf8)',
  success:   'var(--success,   #34d399)',
  warning:   'var(--warning,   #f59e0b)',
  danger:    'var(--danger,    #ef4444)',
  text:      'var(--text,      #fff)',
  textSub:   'var(--text-sub,  #e2e8f0)',
  muted:     'var(--muted,     #64748b)',
  accentLt:  'var(--accent-lt, #93c5fd)',
}

// ── Country flag emoji ──
function countryFlag(code) {
  if (!code || code === 'XX' || code === 'LOCAL') return '🌐'
  try {
    return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
  } catch { return '🌐' }
}

const COUNTRY_NAMES = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  FR: 'France', CA: 'Canada', AU: 'Australia', JP: 'Japan', CN: 'China',
  BR: 'Brazil', RU: 'Russia', KR: 'South Korea', SG: 'Singapore',
  NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  PK: 'Pakistan', BD: 'Bangladesh', NG: 'Nigeria', ZA: 'South Africa',
  LOCAL: 'Local / Dev', XX: 'Unknown',
}
function countryName(code) { return COUNTRY_NAMES[code] || code }

const PAGE_LABELS = {
  '/': '🏠 Home', '/about': '👤 About', '/projects': '🗂️ Projects',
  '/skills': '⚡ Skills', '/contact': '💬 Contact',
}
function pageLabel(page) { return PAGE_LABELS[page] || page }

// ── Stat card ──
function StatCard({ label, value, icon, color = C.primary, sub }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '0.75rem', flexShrink: 0,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem',
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: C.text, lineHeight: 1, fontFamily: 'var(--font-head)' }}>{value}</p>
        {sub && <p style={{ fontSize: '0.7rem', color: C.muted, marginTop: '0.25rem' }}>{sub}</p>}
      </div>
    </Motion.div>
  )
}

// ── Bar row ──
function BarRow({ label, count, max, color = C.primary, icon }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {icon && <span style={{ fontSize: '1.1rem', flexShrink: 0, width: '24px', textAlign: 'center' }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: C.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color, flexShrink: 0, marginLeft: '0.5rem' }}>{count}</span>
        </div>
        <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, transparent))` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Sparkline chart ──
function Sparkline({ data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 280, H = 60, PAD = 4
  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.count / max) * (H - PAD * 2))
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '60px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${PAD},${H} ${points} ${W - PAD},${H}`} fill="url(#spark-grad)" />
        <polyline points={points} fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((d.count / max) * (H - PAD * 2))
          return <circle key={i} cx={x} cy={y} r="3" fill={C.primary} />
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: '0.6rem', color: C.muted }}>
            {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Section card ──
function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.88rem', color: C.text }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Time range toggle ──
function RangeToggle({ range, onChange }) {
  const opts = [{ id: 'today', label: 'Today' }, { id: '7d', label: '7 Days' }, { id: 'all', label: 'All Time' }]
  return (
    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.625rem', padding: '3px' }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: 'none',
          background: range === o.id ? `color-mix(in srgb, ${C.primary} 20%, transparent)` : 'transparent',
          color: range === o.id ? C.accentLt : C.muted,
          fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          boxShadow: range === o.id ? `inset 0 0 0 1px color-mix(in srgb, ${C.accentLt} 20%, transparent)` : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

// ── Self-filter toggle ──
function SelfFilterToggle({ selfFiltered, onToggle, loading }) {
  return (
    <button onClick={onToggle} disabled={loading} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.4rem 0.875rem', borderRadius: '0.625rem', border: 'none',
      background: selfFiltered
        ? `color-mix(in srgb, ${C.success} 12%, transparent)`
        : `color-mix(in srgb, ${C.danger} 10%, transparent)`,
      color: selfFiltered ? C.success : C.danger,
      fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
      boxShadow: selfFiltered
        ? `inset 0 0 0 1px color-mix(in srgb, ${C.success} 25%, transparent)`
        : `inset 0 0 0 1px color-mix(in srgb, ${C.danger} 25%, transparent)`,
      opacity: loading ? 0.5 : 1,
    }}>
      <span>{selfFiltered ? '🙈' : '👁️'}</span>
      {selfFiltered ? 'Self-filter: ON' : 'Self-filter: OFF'}
    </button>
  )
}

// ── Main dashboard ──
export default function AnalyticsDashboard() {
  const [range, setRange] = useState('7d')
  const [stats, setStats] = useState(EMPTY_ANALYTICS)
  const [loading, setLoading] = useState(true)
  const [selfFiltered, setSelfFiltered] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const latestRequestRef = useRef(0)

  const fetchStats = useCallback(async ({ signal } = {}) => {
    const requestId = ++latestRequestRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}?${new URLSearchParams({ range })}`, {
        signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (signal?.aborted || requestId !== latestRequestRef.current) return
      if (json.ok) {
        const nextStats = { ...EMPTY_ANALYTICS, ...(json.data || {}) }
        setStats(nextStats)
        setSelfFiltered(nextStats.selfFiltered)
        setLastRefresh(new Date())
      } else {
        setStats(current => current || EMPTY_ANALYTICS)
        setError(json.error || 'Server returned an error.')
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      if (requestId !== latestRequestRef.current) return
      setStats(current => current || EMPTY_ANALYTICS)
      setError(`API request failed: ${err.message}`)
    } finally {
      if (!signal?.aborted && requestId === latestRequestRef.current) {
        setLoading(false)
      }
    }
  }, [range])

  useEffect(() => {
    const controller = new AbortController()
    fetchStats({ signal: controller.signal })
    return () => controller.abort()
  }, [fetchStats])

  async function toggleSelfFilter() {
    setFilterLoading(true)
    try {
      const res = await fetch(`${API}/ignore-self`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: selfFiltered ? 'allow' : 'ignore' }),
      })
      const json = await res.json()
      if (json.ok) { setSelfFiltered(!selfFiltered); await fetchStats() }
    } catch { /* silent */ } finally { setFilterLoading(false) }
  }

  // ── Loading state ──
  if (loading && stats === EMPTY_ANALYTICS && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: C.muted }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        Loading analytics…
      </div>
    )
  }

  const s = stats
  const maxCountry = Math.max(...(s.topCountries || []).map(c => c.count), 1)
  const maxProject = Math.max(...(s.projectsViewed || []).map(p => p.count), 1)
  const maxContact = Math.max(...(s.contactClicks || []).map(c => c.count), 1)
  const maxPage    = Math.max(...(s.pageViews    || []).map(p => p.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Stale-data error banner ── */}
      <AnimatePresence>
        {error && stats && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: `color-mix(in srgb, ${C.danger} 8%, transparent)`,
              border: `1px solid color-mix(in srgb, ${C.danger} 25%, transparent)`,
              borderRadius: '0.75rem', padding: '0.6rem 1rem',
              fontSize: '0.75rem', color: C.danger,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            ⚠️ Refresh failed — showing last known data.
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', color: C.text }}>📊 Visitor Analytics</h2>
          {lastRefresh && (
            <p style={{ fontSize: '0.68rem', color: C.muted, marginTop: '0.2rem' }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              if (confirm('Delete all analytics data? This cannot be undone.')) {
                await fetch(API, { method: 'DELETE' })
                fetchStats()
              }
            }}
            className="btn btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem', color: C.danger, border: `1px solid color-mix(in srgb, ${C.danger} 20%, transparent)` }}
          >
            🗑️ Clear
          </button>
          <SelfFilterToggle selfFiltered={selfFiltered} onToggle={toggleSelfFilter} loading={filterLoading} />
          <RangeToggle range={range} onChange={setRange} />
          <button onClick={fetchStats} disabled={loading} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem' }}>
            {loading ? '↻' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Self-filter notice ── */}
      <AnimatePresence>
        {selfFiltered && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: `color-mix(in srgb, ${C.success} 7%, transparent)`,
              border: `1px solid color-mix(in srgb, ${C.success} 20%, transparent)`,
              borderRadius: '0.75rem', padding: '0.6rem 1rem',
              fontSize: '0.75rem', color: C.success,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            🙈 Your own visits are being filtered out from all stats below.
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
        <StatCard label="Total Visits"    value={s.totalVisits ?? 0}    icon="👁️" color={C.primary}   sub="Page loads" />
        <StatCard label="Unique Visitors" value={s.uniqueVisitors ?? 0} icon="👤" color={C.secondary} sub="Distinct IPs" />
        <StatCard label="Countries"       value={(s.topCountries ?? []).length} icon="🌍" color={C.success} sub="Reached you" />
        <StatCard label="Contact Clicks"  value={(s.contactClicks ?? []).reduce((a, c) => a + c.count, 0)} icon="💬" color={C.warning} sub="Outreach" />
      </div>

      {/* ── Sparkline ── */}
      {(s.dailyChart ?? []).length > 1 && (
        <Section title="📈 Visits — Last 7 Days">
          <Sparkline data={s.dailyChart} />
        </Section>
      )}

      {/* ── Pages visited ── */}
      <Section title="🗺️ Portfolio Sections Visited">
        {(s.pageViews ?? []).length === 0
          ? <p style={{ fontSize: '0.78rem', color: C.muted, textAlign: 'center', padding: '1rem 0' }}>No page views yet.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {s.pageViews.map(({ page, count }) => (
                <BarRow key={page} label={pageLabel(page)} count={count} max={maxPage} color={C.secondary} />
              ))}
            </div>
        }
      </Section>

      {/* ── Two-column: countries + contact ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.875rem' }}>
        <Section title="🌍 Top Countries">
          {(s.topCountries ?? []).length === 0
            ? <p style={{ fontSize: '0.78rem', color: C.muted, textAlign: 'center', padding: '1rem 0' }}>No data yet.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {s.topCountries.map(({ country, count }) => (
                  <BarRow key={country} label={countryName(country)} count={count} max={maxCountry} color={C.success} icon={countryFlag(country)} />
                ))}
              </div>
          }
        </Section>

        <Section title="💬 Contact Clicks">
          {(s.contactClicks ?? []).length === 0
            ? <p style={{ fontSize: '0.78rem', color: C.muted, textAlign: 'center', padding: '1rem 0' }}>No contact clicks yet.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {s.contactClicks.map(({ platform, count }) => (
                  <BarRow
                    key={platform}
                    label={platform === 'contact_form' ? '📝 Contact Form' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    count={count} max={maxContact} color={C.warning}
                  />
                ))}
              </div>
          }
        </Section>
      </div>

      {/* ── Projects viewed ── */}
      <Section title="🗂️ Projects Viewed">
        {(s.projectsViewed ?? []).length === 0
          ? <p style={{ fontSize: '0.78rem', color: C.muted, textAlign: 'center', padding: '1rem 0' }}>No project clicks yet.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {s.projectsViewed.map(({ project, count }, i) => (
                <BarRow key={project} label={project} count={count} max={maxProject} color={C.primary} icon={['🥇', '🥈', '🥉'][i] || '📦'} />
              ))}
            </div>
        }
      </Section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
