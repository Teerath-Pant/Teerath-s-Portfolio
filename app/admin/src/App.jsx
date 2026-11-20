import { useState, useEffect } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import AdminPanel from './components/AdminPanel.jsx'
import { API_URL, getToken, setToken, clearToken } from './lib/api.js'

function LockScreen({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [shake, setShake] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  function fail(msg) {
    setErrMsg(msg)
    setErr(true)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    setPw('')
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: pw })
      })

      const json = await res.json().catch(() => null)
      if (json?.token) {
        setToken(json.token)
        onUnlock()
      } else {
        fail(json?.error || `Login failed (${res.status})`)
      }
    } catch (error) {
      console.error('Login error:', error)
      fail('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-bg" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(79,142,247,0.08)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(129,140,248,0.07)', filter: 'blur(80px)' }} />
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ position: 'relative', width: '100%', maxWidth: '400px' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '1.25rem',
            background: 'linear-gradient(135deg, #4f8ef7, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 32px rgba(79,142,247,0.4)',
            fontFamily: 'var(--font-head)',
          }}>A</div>
        </div>

        <Motion.form
          animate={shake ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={submit}
          className="card"
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
            Portfolio Admin
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.75rem' }}>
            Sign in to manage your portfolio content
          </p>

          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label className="label">Password</label>
            <input
              type="password"
              className="field"
              placeholder="Enter admin password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(false) }}
              autoFocus
            />
            <AnimatePresence>
              {err && (
                <Motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.4rem' }}
                >
                  {errMsg}
                </Motion.p>
              )}
            </AnimatePresence>
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '0.7rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'rgba(100,116,139,0.5)' }}>
            Changes are saved to the portfolio database
          </p>
        </Motion.form>
      </Motion.div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())

  return (
    <AnimatePresence mode="wait">
      {!authed ? (
        <Motion.div key="lock" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <LockScreen onUnlock={() => setAuthed(true)} />
        </Motion.div>
      ) : (
        <Motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <AdminPanel onLogout={() => { clearToken(); setAuthed(false) }} />
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
