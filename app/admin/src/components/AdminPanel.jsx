import { useState, useEffect } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { defaultData } from '../defaultData.js'
import ProfileTab from './ProfileTab.jsx'
import AboutTab from './AboutTab.jsx'
import ProjectsTab from './ProjectsTab.jsx'
import SkillsTab from './SkillsTab.jsx'
import SocialsTab from './SocialsTab.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import FeedbackTab from './FeedbackTab.jsx'

const STORAGE_KEY = 'portfolio_admin_data'

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'feedback', label: 'Feedback', icon: '⭐' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'about', label: 'About', icon: '📄' },
  { id: 'projects', label: 'Projects', icon: '🗂️' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'socials', label: 'Socials', icon: '🔗' },
]

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <Motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </Motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics')
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    async function initData() {
      let sourceData = defaultData
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
        const res = await fetch(`${API_URL}/api/load`)
        const json = await res.json()
        if (json.ok && json.data) {
          sourceData = json.data
        } else {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) sourceData = JSON.parse(stored)
        }
      } catch (err) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try { sourceData = JSON.parse(stored) } catch {}
        }
      }

      const merged = { ...defaultData }
      for (const key of Object.keys(sourceData)) {
        if (sourceData[key] !== undefined && sourceData[key] !== null) {
          merged[key] = sourceData[key]
        }
      }
      setData(merged)
    }
    initData()
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveToPortfolio() {
    setSaving(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
      const res = await fetch(`${API_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.ok) showToast('Saved! Portfolio is updating…', 'success')
      else showToast('Save failed: ' + json.error, 'error')
    } catch (err) {
      showToast('Could not reach admin server', 'error')
    } finally {
      setSaving(false)
    }
  }

  function resetSection() {
    const key = activeTab === 'profile' ? 'profile'
      : activeTab === 'about' ? ['bioPoints', 'audience', 'goals']
        : activeTab === 'projects' ? 'projectCards'
          : activeTab === 'skills' ? ['skillLevels', 'futureEnhancements', 'technicalMastery']
            : 'socials'
    if (!window.confirm('Reset this section to defaults?')) return
    if (Array.isArray(key)) {
      const patch = {}
      key.forEach(k => { patch[k] = defaultData[k] })
      setData(d => ({ ...d, ...patch }))
    } else {
      setData(d => ({ ...d, [key]: defaultData[key] }))
    }
    showToast('Section reset to defaults', 'success')
  }

  const tabProps = { data, setData }

  if (!data) {
    return (
      <div className="admin-bg" style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading admin data...</div>
      </div>
    )
  }

  return (
    <div className="admin-bg" style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? '220px' : '64px',
        minWidth: sidebarOpen ? '220px' : '64px',
        background: 'rgba(13,21,38,0.97)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1rem 0.75rem',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', paddingLeft: '0.25rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '0.75rem', flexShrink: 0,
            background: 'linear-gradient(135deg,#4f8ef7,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: '0.9rem',
            boxShadow: '0 0 16px rgba(79,142,247,0.35)',
          }}>A</div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap' }}>Admin Panel</span>}
        </div>

        {/* Nav tabs */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.6rem', borderRadius: '0.75rem', border: 'none',
                background: activeTab === tab.id ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: activeTab === tab.id ? '#93c5fd' : 'var(--muted)',
                cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left',
                fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600,
                boxShadow: activeTab === tab.id ? 'inset 0 0 0 1px rgba(147,197,253,0.15)' : 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{tab.icon}</span>
              {sidebarOpen && tab.label}
            </button>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: sidebarOpen ? 'flex-start' : 'center', marginTop: '0.5rem', padding: '0.5rem 0.6rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {sidebarOpen && <span style={{ fontSize: '0.75rem' }}>Collapse</span>}
        </button>

        {/* Logout */}
        <button onClick={onLogout} className="btn btn-ghost"
          style={{ width: '100%', marginTop: '0.25rem', justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: '0.5rem 0.6rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {sidebarOpen && <span style={{ fontSize: '0.75rem' }}>Sign Out</span>}
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(13,21,38,0.7)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
              {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
              {activeTab === 'analytics' ? 'Privacy-respecting visitor tracking'
                : activeTab === 'feedback' ? 'Visitor ratings and comments'
                  : 'Edit and save to update the live portfolio'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a href={import.meta.env.VITE_WEB_URL || "http://localhost:5000"} target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Preview
            </a>
            {activeTab !== 'analytics' && activeTab !== 'feedback' && (
              <>
                <button onClick={resetSection} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
                  Reset
                </button>
                <button onClick={saveToPortfolio} disabled={saving} className="btn btn-primary">
                  {saving ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                    </svg>
                  )}
                  {saving ? 'Saving…' : 'Save & Apply'}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <AnimatePresence mode="wait">
            <Motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {activeTab === 'analytics' && <AnalyticsDashboard />}
              {activeTab === 'feedback' && <FeedbackTab />}
              {activeTab === 'profile' && <ProfileTab  {...tabProps} />}
              {activeTab === 'about' && <AboutTab    {...tabProps} />}
              {activeTab === 'projects' && <ProjectsTab {...tabProps} />}
              {activeTab === 'skills' && <SkillsTab   {...tabProps} />}
              {activeTab === 'socials' && <SocialsTab  {...tabProps} />}
            </Motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Toast toast={toast} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
