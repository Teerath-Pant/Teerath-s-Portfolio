import { useEffect, useCallback, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002'
const ANALYTICS_URL = `${API_URL}/api/track`
const SESSION_KEY = 'portfolio_session_id'

/**
 * Generate or retrieve a persistent session ID.
 * Uses sessionStorage so it survives page refreshes within the same tab
 * but creates a new ID for new tabs/windows.
 */
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    // Simple UUID v4 without crypto dependency
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

/**
 * Fire-and-forget analytics POST.
 * Silently fails if the admin server is not running.
 */
async function track(payload) {
  try {
    await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, session: getSessionId() }),
      // Short timeout — don't block the user
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // Admin server not running — silently ignore
  }
}

/**
 * useAnalytics — call in App.jsx with the current pathname.
 * Fires a pageview event when the route changes.
 *
 * Returns:
 *   trackProjectView(projectTitle) — call when a project link is clicked
 *   trackContactClick(platform)    — call when a contact link is clicked
 */
export function useAnalytics(pathname) {
  const lastTracked = useRef(null)

  useEffect(() => {
    // Deduplicate: don't fire twice for the same route in the same session
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname

    track({ event: 'pageview', page: pathname })
  }, [pathname])

  const trackProjectView = useCallback((projectTitle) => {
    track({ event: 'project_view', project: projectTitle, page: pathname })
  }, [pathname])

  const trackContactClick = useCallback((platform) => {
    track({ event: 'contact_click', platform, page: pathname })
  }, [pathname])

  return { trackProjectView, trackContactClick }
}
