import { NavLink } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import My_image from '../assets/images/My_image.png'
import { API_URL } from '../lib/api'

const getImageUrl = (imgUrl) => {
  if (!imgUrl) return ''
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
    return imgUrl
  }
  return `${API_URL}${imgUrl}`
}

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '1' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    to: '/about',
    label: 'About',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '1' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '1' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/skills',
    label: 'Skills',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: '/contact',
    label: 'Contact',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '1' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
]

// Map platform names to SVG icons for sidebar
const socialIconMap = {
  github: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  linkedin: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  twitter: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.857L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  email: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
  const h = (now.getHours() % 12 || 12).toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now)
  return { h, m, s, ampm, date }
}

export default function SideNav({ portfolioData, isDrawer = false, onClose, onNavigate }) {
  const clock = useClock()
  const expandedClass = isDrawer ? 'block' : 'hidden lg:block'
  const expandedGridClass = isDrawer ? 'grid' : 'hidden lg:grid'
  const asideClass = isDrawer
    ? 'relative flex h-screen w-[280px] max-w-[82vw] shrink-0 flex-col overflow-hidden border-r border-white/8 bg-[#080e1c]/98 px-5 py-5 shadow-[18px_0_60px_rgba(2,6,23,0.38)] backdrop-blur-xl'
    : 'sticky top-0 flex h-screen w-[88px] shrink-0 flex-col overflow-hidden border-r border-white/8 bg-[#080e1c]/95 px-3 py-5 shadow-[18px_0_60px_rgba(2,6,23,0.22)] backdrop-blur-xl lg:w-[280px] lg:px-5'
  const {
    profile = {},
    stats: rawStats = [],
    socials: rawSocials = [],
    skillLevels = [],
  } = portfolioData ?? {}
  const isAvailableForWork = Boolean(profile?.availableForWork)

  const statusStyles = isAvailableForWork
    ? {
        ring: 'ring-emerald-500/30',
        bgRing: 'bg-emerald-500/15',
        ping: 'bg-emerald-400',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
        dotSmall: 'bg-emerald-400',
        borderHover: 'hover:border-emerald-500/28 border-emerald-500/15',
        bgHover: 'hover:from-emerald-500/[0.12] from-emerald-500/[0.08] to-teal-600/[0.04]',
        blurGlow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
        textLabel: 'text-emerald-600/70',
        textValue: 'text-emerald-300',
        icon: 'text-emerald-500/30 group-hover:text-emerald-400/60'
      }
    : {
        ring: 'ring-slate-500/30',
        bgRing: 'bg-slate-500/15',
        ping: 'hidden',
        dot: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
        dotSmall: 'bg-slate-400',
        borderHover: 'hover:border-slate-500/28 border-slate-500/15',
        bgHover: 'hover:from-slate-500/[0.12] from-slate-500/[0.08] to-slate-600/[0.04]',
        blurGlow: 'bg-slate-500/10 group-hover:bg-slate-500/20',
        textLabel: 'text-slate-500/70',
        textValue: 'text-slate-300',
        icon: 'text-slate-500/30 group-hover:text-slate-400/60'
      }
  const stats = rawStats.map((s) => {
    const label = (s.label || '').replace('\n', ' ').split(' ').pop()
    return { label, value: s.value }
  })
  const socials = rawSocials.map((s) => ({
    label: s.label,
    href: s.href,
    icon: socialIconMap[s.platform] || socialIconMap.email,
  }))

  return (
    <aside className={asideClass}>

      {/* ── Logo / Brand ── */}
      <div className={`flex items-center gap-3 ${isDrawer ? 'justify-start' : 'justify-center lg:justify-start'}`}>
        {/* <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.32)]">
          
        </div> */}
        <span className={`${expandedClass} min-w-0 font-heading text-lg font-semibold tracking-wide text-white`} ></span>
        {isDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Profile mini-card ── */}
      <Motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className={`${expandedClass} mt-4`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.09),transparent_70%)]" />
          <div className="relative flex items-center gap-3">
            <div
              className="h-10 w-10 shrink-0 rounded-xl border border-white/15 bg-cover bg-center shadow-lg"
              style={{ backgroundImage: `url(${profile?.avatarUrl ? getImageUrl(profile.avatarUrl) : My_image})` }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white leading-tight">{profile?.name || 'Portfolio'}</p>
              <p className="truncate text-[11px] text-slate-500 mt-0.5">{profile?.title || 'Developer'}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {skillLevels.slice(0, 2).map((skill, index) => (
                  <span key={skill.label || index} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold border ${index === 0 ? 'bg-blue-500/15 text-blue-300 border-blue-500/20' : 'bg-violet-500/15 text-violet-300 border-violet-500/20'}`}>
                    {skill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Motion.div>

      {/* ── Nav items ── */}
      <nav className="mt-5 flex w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, i) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onNavigate} className="block rounded-[1.2rem] outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e1c]">
            {({ isActive }) => (
              <Motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.3, ease: 'easeOut' }}
                className={`group relative flex h-11 items-center ${isDrawer ? 'justify-start' : 'justify-center lg:justify-start'} gap-3.5 rounded-[1.2rem] px-3 transition-all duration-300 lg:px-4 ${
                  isActive
                    ? 'bg-blue-200/15 text-blue-200 shadow-[inset_0_0_0_1px_rgba(147,197,253,0.14)]'
                    : 'text-slate-400 hover:bg-white/6 hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <Motion.span
                    layoutId="side-nav-active"
                    className={`${expandedClass} absolute left-0 h-5 w-1 rounded-r-full bg-blue-300`}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="grid h-5 w-5 shrink-0 place-items-center transition-transform duration-300 group-hover:scale-110">{item.icon(isActive)}</span>
                <span className={`${expandedClass} min-w-0 truncate text-sm font-medium tracking-wide`}>{item.label}</span>
              </Motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ════ BOTTOM SECTION ════ */}
      <div className="mt-3 flex shrink-0 flex-col gap-2.5">

        {/* Live Clock */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={`${expandedClass} rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3`}
        >
          <p className="text-[9px] font-bold tracking-[0.22em] text-slate-600 uppercase mb-1.5">Local Time</p>
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-1">
              <span className="font-mono text-[1.6rem] font-bold tabular-nums leading-none text-white">{clock.h}:{clock.m}</span>
              <span className="mb-0.5 font-mono text-xs font-semibold tabular-nums text-slate-600">:{clock.s}</span>
              <span className="mb-0.5 ml-0.5 text-[11px] font-bold text-blue-400/80">{clock.ampm}</span>
            </div>
            <span className="text-[10px] text-slate-600 mb-0.5">{clock.date}</span>
          </div>
        </Motion.div>

        {/* Stats row */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className={`${expandedGridClass} grid-cols-3 gap-2`}
        >
          {stats.map((s) => (
            <div key={s.label} className="group flex flex-col items-center rounded-xl border border-white/6 bg-white/[0.025] py-2.5 px-1 transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/20 cursor-default">
              <span className="text-[15px] font-bold text-white group-hover:text-blue-300 transition-colors">{s.value}</span>
              <span className="mt-0.5 text-[9px] font-medium tracking-wide text-slate-600 uppercase">{s.label}</span>
            </div>
          ))}
        </Motion.div>

        {/* Social connect row */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className={`${expandedClass} rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3`}
        >
          <p className="mb-2.5 text-[9px] font-bold tracking-[0.22em] text-slate-600 uppercase">Connect</p>
          <div className="flex items-center justify-between gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="group flex h-8 w-full items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-slate-500 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300 hover:-translate-y-0.5"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </Motion.div>

        {/* Divider */}
        <div className={`${expandedClass} h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent`} />

        {/* Status card */}
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          {/* Collapsed (icon-only) */}
          <div className={`${isDrawer ? 'hidden' : 'flex lg:hidden'} justify-center`}>
            <div className={`relative flex h-9 w-9 items-center justify-center rounded-full ${statusStyles.bgRing} ring-1 ${statusStyles.ring}`}>
              <span className="relative flex h-2 w-2">
                {profile?.availableForWork && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusStyles.ping} opacity-60`} />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${statusStyles.dotSmall}`} />
              </span>
            </div>
          </div>

          {/* Expanded */}
          <div className={`group ${expandedClass} relative overflow-hidden rounded-2xl border ${statusStyles.borderHover} bg-gradient-to-br ${statusStyles.bgHover} p-4 transition-all duration-300`}>
            <div className={`pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full ${statusStyles.blurGlow} blur-2xl transition-all duration-500`} />
            <div className="relative flex items-center gap-3">
              <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${statusStyles.bgRing} ring-1 ${statusStyles.ring}`}>
                <span className="relative flex h-2.5 w-2.5">
                  {profile?.availableForWork && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusStyles.ping} opacity-60`} />}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusStyles.dot}`} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] font-bold tracking-[0.2em] ${statusStyles.textLabel} uppercase leading-none`}>Status</p>
                <p className={`mt-1 text-sm font-semibold leading-none ${statusStyles.textValue}`}>{profile?.availableForWork ? 'Available for work' : 'Currently unavailable'}</p>
              </div>
              <svg className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 ${statusStyles.icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Motion.div>

      </div>
    </aside>
  )
}
