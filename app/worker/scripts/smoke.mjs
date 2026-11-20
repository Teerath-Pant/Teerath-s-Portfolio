// Smoke test against a running API (local or production).
//   BASE=http://127.0.0.1:8787 ADMIN_PASSWORD=... node scripts/smoke.mjs [--full]
// Without --full it is read-only (safe for production). --full also saves sample data
// (OVERWRITES the portfolio) and trips the login rate limiter, so use it on local only.
const BASE = (process.env.BASE || 'http://127.0.0.1:8787').replace(/\/$/, '')
const PASSWORD = process.env.ADMIN_PASSWORD
const FULL = process.argv.includes('--full')
const GOOD_ORIGIN = process.env.ORIGIN || 'https://teerath-admin.vercel.app'

let failed = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + extra}`)
  if (!ok) failed++
}
const call = (path, { method = 'GET', body, token, origin, headers = {} } = {}) =>
  fetch(BASE + path, {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

let r = await call('/')
check('health', r.status === 200)

r = await call('/api/load')
const load = await r.json()
check('GET /api/load is public', r.status === 200 && load.ok === true, JSON.stringify(load))

r = await call('/api/save', { method: 'POST', body: {} })
check('save without token -> 401', r.status === 401)
r = await call('/api/save', { method: 'POST', body: {}, token: 'garbage' })
check('save with bad token -> 401', r.status === 401)

r = await call('/api/admin/login', { method: 'POST', body: { password: 'definitely-wrong-password' } })
check('wrong password -> 401', r.status === 401)

r = await call('/api/load', { origin: GOOD_ORIGIN })
check('CORS allows admin origin', r.headers.get('access-control-allow-origin') === GOOD_ORIGIN)
r = await call('/api/load', { origin: 'https://evil.example' })
check('CORS blocks other origin', !r.headers.get('access-control-allow-origin'))

if (!PASSWORD) {
  console.log('SKIP  authenticated checks (set ADMIN_PASSWORD)')
} else {
  r = await call('/api/admin/login', { method: 'POST', body: { password: PASSWORD } })
  const login = await r.json()
  check('login with correct password', r.status === 200 && !!login.token, JSON.stringify(login))
  const token = login.token

  r = await call('/api/save', { method: 'POST', body: { projectCards: [{ title: 'x', images: ['data:image/png;base64,AAAA'] }] }, token })
  check('save rejects data: images -> 400', r.status === 400)

  if (FULL && token) {
    const doc = {
      profile: { name: 'Smoke Test', availableForWork: true },
      goals: ['g1', 'g2'],
      projectCards: [
        { title: 'P1', images: ['https://example.com/a.png'], showOnHome: true },
        { title: 'P2', images: [] },
      ],
      skillLevels: [{ label: 'JS', value: 90 }],
      technicalMastery: [{ title: 'Frontend', icon: 'x', skills: ['React', 'Vite'] }],
      socials: [{ label: 'GitHub', href: 'https://github.com', platform: 'github' }],
      stats: [{ value: '+1', label: 'Test' }],
      sectionTitles: { skillLevels: 'My Custom Title' },
    }
    r = await call('/api/save', { method: 'POST', body: doc, token })
    check('save valid document', r.status === 200, await r.text())

    const got = (await (await call('/api/load')).json()).data
    check('load returns saved data in order', got?.profile?.name === 'Smoke Test' && got.goals.join() === 'g1,g2' && got.projectCards[0].title === 'P1' && got.projectCards[0].images[0] === 'https://example.com/a.png' && got.technicalMastery[0].skills.join() === 'React,Vite', JSON.stringify(got))

    check('load returns saved section title', got?.sectionTitles?.skillLevels === 'My Custom Title', JSON.stringify(got?.sectionTitles))
    r = await call('/api/save', { method: 'POST', body: { sectionTitles: { skillLevels: 'x'.repeat(101) } }, token })
    check('section title too long -> 400', r.status === 400)

    r = await call('/api/load')
    const etag = r.headers.get('etag')
    check('load sends ETag + no-cache', !!etag && r.headers.get('cache-control') === 'no-cache', String(etag))
    r = await call('/api/load', { headers: { 'If-None-Match': etag } })
    check('load with matching ETag -> 304', r.status === 304)
    r = await call('/api/save', { method: 'POST', body: { goals: ['g3'] }, token })
    r = await call('/api/load', { headers: { 'If-None-Match': etag } })
    check('after save, old ETag -> 200 with new ETag', r.status === 200 && r.headers.get('etag') !== etag)

    // ── images (KV) ──
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])
    const up = (bytes, tok) => fetch(BASE + '/api/upload', { method: 'POST', headers: { 'Content-Type': 'image/png', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: bytes })
    check('upload without token -> 401', (await up(png)).status === 401)
    check('upload non-image -> 400', (await up(new TextEncoder().encode('<svg onload=alert(1)>'), token)).status === 400)
    r = await up(png, token)
    const upJson = await r.json()
    check('upload png', r.status === 200 && /^\/api\/img\/[0-9a-f-]{36}$/.test(upJson.url ?? ''), JSON.stringify(upJson))
    r = await call(upJson.url ?? '/api/img/x')
    const back = new Uint8Array(await r.arrayBuffer())
    check('image served with right type, nosniff, immutable cache', r.status === 200 && r.headers.get('content-type') === 'image/png' && r.headers.get('x-content-type-options') === 'nosniff' && /immutable/.test(r.headers.get('cache-control')) && back.length === png.length)
    check('unknown image id -> 404', (await call('/api/img/00000000-0000-4000-8000-000000000000')).status === 404)
    r = await call('/api/save', { method: 'POST', body: { profile: { avatarUrl: upJson.url }, projectCards: [{ title: 'Img', images: [upJson.url] }] }, token })
    check('save accepts uploaded image url', r.status === 200, await r.text())

    // ── feedback ──
    check('feedback bad rating -> 400', (await call('/api/feedback', { method: 'POST', body: { rating: 9 } })).status === 400)
    check('feedback list without token -> 401', (await call('/api/feedback')).status === 401)
    check('feedback submit', (await call('/api/feedback', { method: 'POST', body: { rating: 5, comment: 'nice', name: 'Tester' } })).status === 200)
    const fb = await (await call('/api/feedback', { token })).json()
    check('admin lists feedback', fb.ok && fb.data.some((f) => f.comment === 'nice' && f.rating === 5), JSON.stringify(fb))
    r = await call('/api/feedback', { method: 'DELETE', token })
    check('admin clears feedback', r.status === 200 && (await (await call('/api/feedback', { token })).json()).data.length === 0)

    // ── contact form (limiter allows 3 per minute, so exactly 3 posts here) ──
    check('contact bad email -> 400', (await call('/api/contact', { method: 'POST', body: { name: 'A', email: 'nope', message: 'hi' } })).status === 400)
    check('contact empty message -> 400', (await call('/api/contact', { method: 'POST', body: { name: 'A', email: 'a@b.co', message: '   ' } })).status === 400)
    check('contact submit', (await call('/api/contact', { method: 'POST', body: { name: 'Smoke Visitor', email: 'visitor@example.com', message: 'Hello <b>there</b>\nline two' } })).status === 200)
    check('contact list without token -> 401', (await call('/api/contact')).status === 401)
    let cm
    for (let i = 0; i < 10 && !cm?.notified; i++) {
      await new Promise((r) => setTimeout(r, 300)) // email status is written after the response
      cm = (await (await call('/api/contact', { token })).json()).data?.find((m) => m.name === 'Smoke Visitor')
    }
    check('admin sees the message (text stored as-is)', cm?.email === 'visitor@example.com' && cm.message === 'Hello <b>there</b>\nline two' && cm.read === false, JSON.stringify(cm))
    check('email status recorded', !!cm?.notified, JSON.stringify(cm))
    console.log('INFO  email status:', cm?.notified)
    r = await call(`/api/contact/${cm?.id}/read`, { method: 'POST', body: { read: true }, token })
    check('mark read', r.status === 200 && (await (await call('/api/contact', { token })).json()).data.find((m) => m.id === cm.id).read === true)
    r = await call(`/api/contact/${cm?.id}`, { method: 'DELETE', token })
    check('delete message', r.status === 200 && !(await (await call('/api/contact', { token })).json()).data.some((m) => m.id === cm.id))

    // ── analytics ──
    check('analytics without token -> 401', (await call('/api/analytics')).status === 401)
    check('track bad event -> 400', (await call('/api/track', { method: 'POST', body: { event: 'nope' } })).status === 400)
    await call('/api/track', { method: 'POST', body: { event: 'pageview', page: '/projects', session: 's1' } })
    await call('/api/track', { method: 'POST', body: { event: 'project_view', project: 'P1', session: 's1' } })
    await call('/api/track', { method: 'POST', body: { event: 'contact_click', platform: 'github', session: 's1' } })
    let an = (await (await call('/api/analytics?range=7d', { token })).json()).data
    check('analytics aggregates', an?.totalVisits === 1 && an.uniqueVisitors === 1 && an.pageViews[0]?.page === '/projects' && an.projectsViewed[0]?.project === 'P1' && an.contactClicks[0]?.platform === 'github' && /^[A-Z]{2}$/.test(an.topCountries[0]?.country ?? ''), JSON.stringify(an))
    await call('/api/analytics/ignore-self', { method: 'POST', body: { action: 'ignore' }, token })
    an = (await (await call('/api/analytics?range=7d', { token })).json()).data
    check('ignore-self hides my visits and events', an.selfFiltered === true && an.totalVisits === 0 && an.projectsViewed.length === 0, JSON.stringify(an))
    await call('/api/analytics/ignore-self', { method: 'POST', body: { action: 'allow' }, token })
    r = await call('/api/analytics', { method: 'DELETE', token })
    an = (await (await call('/api/analytics', { token })).json()).data
    check('admin clears analytics', r.status === 200 && an.totalVisits === 0)

    let last
    for (let i = 0; i < 8; i++) last = (await call('/api/admin/login', { method: 'POST', body: { password: 'wrong-wrong-wrong' } })).status
    check('login is rate limited -> 429', last === 429, `last status ${last}`)
  }
}

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
