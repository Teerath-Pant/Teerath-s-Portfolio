import { useState, useEffect, useCallback } from 'react'
import { motion as Motion } from 'framer-motion'

const API = '/api/feedback'

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

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} style={{ color: star <= rating ? '#f59e0b' : '#334155', fontSize: '1rem' }}>★</span>
      ))}
    </div>
  )
}

export default function FeedbackTab() {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API)
      const json = await res.json()
      if (json.ok) {
        // Sort by newest first
        setFeedback(json.data.sort((a, b) => new Date(b.date) - new Date(a.date)))
      } else {
        setError('Failed to load feedback data.')
      }
    } catch {
      setError('Admin server not reachable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--muted)' }}>
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <p>{error}</p>
        <button onClick={fetchFeedback} className="btn btn-ghost">Try Again</button>
      </div>
    )
  }

  if (loading && feedback.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: 'var(--muted)' }}>
        Loading feedback…
      </div>
    )
  }

  const totalFeedback = feedback.length
  const avgRating = totalFeedback > 0
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / totalFeedback).toFixed(1)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>⭐ Visitor Feedback</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to delete all feedback? This cannot be undone.')) {
                await fetch(API, { method: 'DELETE' });
                fetchFeedback();
              }
            }}
            className="btn btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            🗑️ Clear
          </button>
          <button onClick={fetchFeedback} disabled={loading} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem' }}>
            {loading ? '↻' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
        <StatCard label="Average Rating" value={avgRating} icon="⭐" color="#f59e0b" sub="Out of 5 stars" />
        <StatCard label="Total Submissions" value={totalFeedback} icon="💬" color="#4f8ef7" sub="Feedback received" />
      </div>

      {/* ── Feedback List ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1.5rem',
      }}>
        {feedback.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', padding: '2rem 0' }}>
            No feedback received yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feedback.map((item, index) => (
              <Motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{item.name || 'Anonymous'}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                        {new Date(item.date).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <StarRating rating={item.rating} />
                  </div>
                </div>
                {item.comment && (
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}>
                    {item.comment}
                  </div>
                )}
              </Motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
