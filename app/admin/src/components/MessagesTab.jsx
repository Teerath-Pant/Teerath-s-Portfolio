import { useState, useEffect, useCallback } from 'react'
import { motion as Motion } from 'framer-motion'
import { API_URL, authFetch } from '../lib/api.js'

const API = `${API_URL}/api/contact`

// D1 stores UTC as 'YYYY-MM-DD HH:MM:SS'
const toDate = (s) => new Date(String(s).replace(' ', 'T') + 'Z')

// what: 'emailed' (notification to you) or 'confirmed' (confirmation to the visitor)
function EmailBadge({ status, what = 'emailed' }) {
  if (!status) return null
  const sent = status === 'sent'
  const label = sent ? `✉ ${what}` : status.startsWith('skipped') ? `✉ not ${what}` : `✉ ${what} failed`
  return (
    <span
      title={status}
      style={{
        fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '99px',
        color: sent ? '#34d399' : '#f59e0b',
        border: `1px solid ${sent ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`,
      }}
    >{label}</span>
  )
}

export default function MessagesTab() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.ok) setMessages(json.data)
      else setError('Failed to load messages.')
    } catch {
      setError('Server not reachable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleRead(m) {
    const res = await authFetch(`${API}/${m.id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: !m.read }),
    })
    if (res.ok) setMessages(list => list.map(x => (x.id === m.id ? { ...x, read: !m.read } : x)))
  }

  async function remove(m) {
    if (!confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return
    const res = await authFetch(`${API}/${m.id}`, { method: 'DELETE' })
    if (res.ok) setMessages(list => list.filter(x => x.id !== m.id))
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--muted)' }}>
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <p>{error}</p>
        <button onClick={load} className="btn btn-ghost">Try Again</button>
      </div>
    )
  }

  if (loading && messages.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--muted)' }}>
        Loading messages…
      </div>
    )
  }

  const unread = messages.filter(m => !m.read).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
          ✉️ Contact Messages
          <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem', fontWeight: 600, color: unread ? '#93c5fd' : 'var(--muted)' }}>
            {messages.length} total · {unread} unread
          </span>
        </h2>
        <button onClick={load} disabled={loading} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem' }}>
          {loading ? '↻' : '↻ Refresh'}
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', padding: '2rem 0' }}>
            No messages yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((m, index) => (
              <Motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 10) * 0.04, duration: 0.3 }}
                style={{
                  background: m.read ? 'rgba(255,255,255,0.02)' : 'rgba(79,142,247,0.07)',
                  border: `1px solid ${m.read ? 'rgba(255,255,255,0.05)' : 'rgba(79,142,247,0.25)'}`,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {!m.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f8ef7' }} aria-label="unread" />}
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{m.name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                        {toDate(m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <EmailBadge status={m.notified} />
                      <EmailBadge status={m.confirmation} what="confirmed" />
                    </div>
                    <a href={`mailto:${m.email}`} style={{ color: '#93c5fd', fontSize: '0.8rem', textDecoration: 'none' }}>{m.email}</a>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => toggleRead(m)} className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '0.3rem 0.65rem' }}>
                      {m.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button onClick={() => remove(m)} className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '0.3rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      🗑️
                    </button>
                  </div>
                </div>
                {/* React escapes the text; pre-wrap keeps the visitor's line breaks */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text)', fontSize: '0.85rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.message}
                </div>
              </Motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
