export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002'

const TOKEN_KEY = 'admin_token'
export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)

// fetch + bearer token. Expired/invalid token => drop it and reload to the lock screen.
export async function authFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
  }
  return res
}

// Upload one image file. The Worker stores it and returns a relative URL (`/api/img/<id>`),
// which is what gets saved in the portfolio data (never the image bytes).
export async function uploadImage(file) {
  const res = await authFetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.url) throw new Error(json.error || `Upload failed (${res.status})`)
  return json.url
}
