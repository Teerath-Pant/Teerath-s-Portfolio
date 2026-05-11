import { useState, useEffect, useCallback } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

const API = '/api/analytics'

// ── Country flag emoji from 2-letter code ──
function countryFlag(code) {
  if (!code || code === 'XX' || code === 'LOCAL') return '🌐'
  try {
    return code
      .toUpperCase()
      .split('')
      .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
      .join('')
  } catch {
    return '🌐'
  }
}

// ── Country name from code ──
const COUNTRY_NAMES = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  FR: 'France', CA: 'Canada', AU: 'Australia', JP: 'Japan', CN: 'China',
  BR: 'Brazil', RU: 'Russia', KR: 'South Korea', SG: 'Singapore',
  NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  PK: 'Pakistan', BD: 'Bangladesh', NG: 'Nigeria', ZA: 'South Africa',
  LOCAL: 'Local / Dev', XX: 'Unknown',
}
function countryName(code) {
  return COUNTRY_NAMES[code] || code
}

// ── Page labels ──
const PAGE_LABELS = {
  '/': '🏠 Home',
  '/about': '👤 About',
  '/projects': '🗂️ Projects',
  '/skills': '⚡ Skills',
  '/contact': '💬 Contact',
}
function pageLabel(page) {
  return PAGE_LABELS[page] || page
}

// ── Stat card ──
function StatCard({ label, value, icon, color = '#4f8ef7', sub }) {
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
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem',
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-head)' }}>{value}</p>
        {sub && <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{sub}</p>}
      </div>
    </Motion.div>
  )
}

// ── Bar row ──
function BarRow({ label, count, max, color = '#4f8ef7', icon }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {icon && <span style={{ fontSize: '1.1rem', flexShrink: 0, width: '24px', textAlign: 'center' }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color, flexShrink: 0, marginLeft: '0.5rem' }}>{count}</span>
        </div>
        <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg, ${color}, ${color}99)` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Sparkline chart (last 7 days) ──
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
            <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f8ef7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <polygon
          points={`${PAD},${H} ${points} ${W - PAD},${H}`}
          fill="url(#spark-grad)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#4f8ef7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((d, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((d.count / max) * (H - PAD * 2))
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#4f8ef7" />
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
            {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Section card ──
function Section({ title, children, action }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Time range toggle ──
function RangeToggle({ range, onChange }) {
  const opts = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: 'all', label: 'All Time' },
  ]
  return (
    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.625rem', padding: '3px' }}>
      {opts.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: 'none',
            background: range === o.id ? 'rgba(79,142,247,0.2)' : 'transparent',
            color: range === o.id ? '#93c5fd' : 'var(--muted)',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
            boxShadow: range === o.id ? 'inset 0 0 0 1px rgba(147,197,253,0.2)' : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Self-filter toggle ──
function SelfFilterToggle({ selfFiltered, onToggle, loading }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.4rem 0.875rem', borderRadius: '0.625rem', border: 'none',
        background: selfFiltered ? 'rgba(52,211,153,0.12)' : 'rgba(244,63,94,0.1)',
        color: selfFiltered ? 'var(--success)' : 'var(--danger)',
        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
        boxShadow: selfFiltered ? 'inset 0 0 0 1px rgba(52,211,153,0.25)' : 'inset 0 0 0 1px rgba(244,63,94,0.25)',
        opacity: loading ? 0.5 : 1,
      }}
    >
      <span>{selfFiltered ? '🙈' : '👁️'}</span>
      {selfFiltered ? 'Self-filter: ON' : 'Self-filter: OFF'}
    </button>
  )
}

// ── Main dashboard ──
export default function AnalyticsDashboard() {
  const [range, setRange] = useState('7d')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selfFiltered, setSelfFiltered] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}?range=${range}`)
      const json = await res.json()
      if (json.ok) {
        setStats(json.data)
        setSelfFiltered(json.data.selfFiltered)
        setLastRefresh(new Date())
      } else {
        setError('Failed to load analytics data.')
      }
    } catch {
      setError('Admin server not reachable. Make sure npm run dev:admin is running.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetchStats() }, [fetchStats])

  async function toggleSelfFilter() {
    setFilterLoading(true)
    try {
      const action = selfFiltered ? 'allow' : 'ignore'
      const res = await fetch('/api/analytics/ignore-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.ok) {
        setSelfFiltered(!selfFiltered)
        // Refresh stats after toggling
        await fetchStats()
      }
    } catch {
      // silent fail
    } finally {
      setFilterLoading(false)
    }
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
        <span style={{ fontSize: '2.5rem' }}>📡</span>
        <p style={{ fontSize: '0.85rem', maxWidth: '340px', lineHeight: 1.6 }}>{error}</p>
        <button onClick={fetchStats} className="btn btn-ghost" style={{ fontSize: '0.78rem' }}>
          Try Again
        </button>
      </div>
    )
  }

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: 'var(--muted)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        Loading analytics…
      </div>
    )
  }

  const s = stats || {}
  const maxCountry = Math.max(...(s.topCountries || []).map(c => c.count), 1)
  const maxProject = Math.max(...(s.projectsViewed || []).map(p => p.count), 1)
  const maxContact = Math.max(...(s.contactClicks || []).map(c => c.count), 1)
  const maxPage = Math.max(...(s.pageViews || []).map(p => p.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>📊 Visitor Analytics</h2>
          {lastRefresh && (
            <p style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to delete all visitor analytics data? This cannot be undone.')) {
                await fetch('/api/analytics', { method: 'DELETE' });
                fetchStats();
              }
            }}
            className="btn btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
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
              background: 'rgba(52,211,153,0.07)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: '0.75rem',
              padding: '0.6rem 1rem',
              fontSize: '0.75rem', color: 'var(--success)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            🙈 Your own visits are being filtered out from all stats below.
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
        <StatCard label="Total Visits" value={s.totalVisits ?? 0} icon="👁️" color="#4f8ef7" sub="Page loads" />
        <StatCard label="Unique Visitors" value={s.uniqueVisitors ?? 0} icon="👤" color="#818cf8" sub="Distinct IPs" />
        <StatCard label="Countries" value={(s.topCountries ?? []).length} icon="🌍" color="#34d399" sub="Reached you" />
        <StatCard label="Contact Clicks" value={(s.contactClicks ?? []).reduce((a, c) => a + c.count, 0)} icon="💬" color="#f59e0b" sub="Outreach" />
      </div>

      {/* ── Sparkline — last 7 days ── */}
      {(s.dailyChart ?? []).length > 1 && (
        <Section title="📈 Visits — Last 7 Days">
          <Sparkline data={s.dailyChart} />
        </Section>
      )}

      {/* ── Pages visited (who visited which section) ── */}
      <Section title="🗺️ Portfolio Sections Visited">
        {(s.pageViews ?? []).length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem 0' }}>No page views yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {s.pageViews.map(({ page, count }) => (
              <BarRow
                key={page}
                label={pageLabel(page)}
                count={count}
                max={maxPage}
                color="#818cf8"
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Two-column: countries + contact ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.875rem' }}>

        {/* Top countries */}
        <Section title="🌍 Top Countries">
          {(s.topCountries ?? []).length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem 0' }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {s.topCountries.map(({ country, count }) => (
                <BarRow
                  key={country}
                  label={countryName(country)}
                  count={count}
                  max={maxCountry}
                  color="#34d399"
                  icon={countryFlag(country)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Contact clicks */}
        <Section title="💬 Contact Clicks">
          {(s.contactClicks ?? []).length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem 0' }}>No contact clicks yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {s.contactClicks.map(({ platform, count }) => (
                <BarRow
                  key={platform}
                  label={platform === 'contact_form' ? '📝 Contact Form' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  count={count}
                  max={maxContact}
                  color="#f59e0b"
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Projects viewed ── */}
      <Section title="🗂️ Projects Viewed">
        {(s.projectsViewed ?? []).length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem 0' }}>No project clicks yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {s.projectsViewed.map(({ project, count }, i) => (
              <BarRow
                key={project}
                label={project}
                count={count}
                max={maxProject}
                color="#4f8ef7"
                icon={['🥇', '🥈', '🥉'][i] || '📦'}
              />
            ))}
          </div>
        )}
      </Section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
