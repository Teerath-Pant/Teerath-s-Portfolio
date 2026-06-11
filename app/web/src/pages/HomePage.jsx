import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import profileImage from '../assets/images/profile.png'
import { API_URL } from '../lib/api'

const getImageUrl = (imgUrl) => {
  if (!imgUrl) return ''
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
    return imgUrl
  }
  return `${API_URL}${imgUrl}`
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut', delay },
})

const socialIcons = {
  github: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  twitter: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.857L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  email: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
}

const masteryIcons = {
  frontend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  backend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
  devops: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
}

// ── Per-project card with its own image slider ─────────────────────
function ProjectCard({ proj, index }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const imgs = (proj.images || []).filter(Boolean)
  const hasMany = imgs.length > 1

  const goImg = (d) => setImgIdx(i => (i + d + imgs.length) % imgs.length)

  const href = proj.link && proj.link !== '#'
    ? (proj.link.match(/^https?:\/\//i) ? proj.link : `https://${proj.link}`)
    : '#'

  return (
    <Motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#0b1120] shadow-lg"
    >
      {/* Image slider */}
      <div className="relative h-52 md:h-[28rem] overflow-hidden">
        {/* Track */}
        <div
          className="flex h-full transition-transform duration-500"
          style={{ transform: `translateX(-${imgIdx * 100}%)`, transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)' }}
        >
          {imgs.length > 0 ? imgs.map((img, ii) => (
            <div
              key={ii}
              className="min-w-full h-full overflow-hidden"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onTouchStart={() => setZoomed(true)}
              onTouchEnd={() => setTimeout(() => setZoomed(false), 600)}
            >
              <img
                src={getImageUrl(img)}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
                style={{ transform: zoomed && ii === imgIdx ? 'scale(1.1)' : 'scale(1)' }}
              />
            </div>
          )) : (
            <div className="min-w-full h-full bg-white/5" />
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120]/60 via-transparent to-transparent pointer-events-none" />

        {/* Tag */}
        {proj.tag && (
          <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {proj.tag}
          </span>
        )}

        {/* Arrows */}
        {hasMany && (
          <>
            {[-1, 1].map(d => (
              <Motion.button
                key={d}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => goImg(d)}
                className={`absolute top-1/2 -translate-y-1/2 ${d === -1 ? 'left-2.5' : 'right-2.5'} flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white text-lg backdrop-blur-sm hover:bg-black/75 transition-colors`}
                aria-label={d === -1 ? 'Previous image' : 'Next image'}
              >
                {d === -1 ? '‹' : '›'}
              </Motion.button>
            ))}
          </>
        )}

        {/* Dots */}
        {hasMany && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imgs.map((_, ii) => (
              <Motion.button
                key={ii}
                onClick={() => setImgIdx(ii)}
                animate={{ scale: ii === imgIdx ? 1.4 : 1, opacity: ii === imgIdx ? 1 : 0.35 }}
                transition={{ duration: 0.2 }}
                className="h-1.5 w-1.5 rounded-full bg-white border-none p-0 cursor-pointer"
                aria-label={`Image ${ii + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {hasMany && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">
            {imgIdx + 1} / {imgs.length}
          </span>
        )}
      </div>

      {/* Card body */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={`body-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-5 md:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-bold text-white">{proj.title}</h3>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">
            {proj.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5 transition-colors"
            >
              View project
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            {proj.tag && (
              <span className="rounded bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 tracking-wider uppercase">
                {proj.tag}
              </span>
            )}
          </div>
        </Motion.div>
      </AnimatePresence>
    </Motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function HomePage({ now, portfolioData }) {
  const navigate = useNavigate()
  const { profile, stats, socials, technicalMastery, projectCards } = portfolioData
  const featuredProjects = (projectCards || []).filter(project => project.showOnHome).slice(0, 3)

  const currentWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now)
  const currentDay = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(now)
  const currentMonth = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now)

  return (
    <div className="relative flex min-h-full flex-col gap-7 md:gap-10">

      {/* ══════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════ */}
      <section className="flex flex-col md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-stretch">

        {/* LEFT: Profile Card */}
        <Motion.div {...fadeUp(0.05)} className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.035] backdrop-blur-md shadow-[0_18px_48px_rgba(2,6,23,0.22)] flex flex-col">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,142,247,0.12),transparent_65%)]" />
          <div
            className="relative mx-auto mt-8 h-44 w-44 lg:h-52 lg:w-52 overflow-hidden rounded-[1.75rem] border border-white/12 bg-cover bg-center shadow-2xl"
            style={{ backgroundImage: `url(${profile?.avatarUrl ? getImageUrl(profile.avatarUrl) : profileImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#080e1c]/60 to-transparent" />
          </div>
          <div className="relative flex flex-col items-center px-6 pb-6 pt-5 flex-1">
            <h2 className="font-heading text-xl lg:text-2xl font-bold text-white text-center leading-tight">{profile.name}</h2>
            <p className="mt-1 text-sm text-slate-400 text-center">{profile.title}</p>
            <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[11px] font-medium text-slate-400">{profile.location}</span>
            </div>
            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2.5">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                  className="group flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-slate-400 transition-all duration-200 hover:border-blue-500/35 hover:bg-blue-500/12 hover:text-blue-300 hover:-translate-y-0.5">
                  {socialIcons[s.platform] || socialIcons.email}
                </a>
              ))}
            </div>
            <Motion.a
              href="/contact"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-shadow duration-300 hover:shadow-[0_0_28px_rgba(59,130,246,0.5)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              Let's Talk
            </Motion.a>
          </div>
        </Motion.div>

        {/* RIGHT: Hero Text + Stats */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/6 bg-gradient-to-br from-[rgba(79,142,247,0.1)] to-[rgba(129,140,248,0.05)] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col justify-center px-8 py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,142,247,0.18),transparent_60%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="relative">
            <Motion.p {...fadeUp(0.1)} className="text-xs font-semibold tracking-[0.3em] text-blue-400/70 uppercase lg:text-sm">
              {currentWeekday} · {currentDay} {currentMonth}
            </Motion.p>
            <Motion.h1 {...fadeUp(0.15)} className="mt-4 font-heading text-4xl font-extrabold leading-[1.1] text-white lg:text-5xl xl:text-6xl">
              {profile.headline}
            </Motion.h1>
            <Motion.p {...fadeUp(0.2)} className="mt-5 max-w-xl text-sm leading-7 text-slate-400 lg:text-base lg:leading-8">
              {profile.subtext}
            </Motion.p>
            <Motion.div {...fadeUp(0.25)} className="mt-8 flex flex-wrap items-center gap-6 lg:gap-10">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-heading text-center text-3xl font-extrabold text-white lg:text-4xl">{s.value}</span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 whitespace-pre-line leading-4">{s.label}</span>
                </div>
              ))}
            </Motion.div>
            <Motion.div {...fadeUp(0.28)} className="mt-8 h-px w-full bg-gradient-to-r from-white/10 via-white/6 to-transparent" />
            <Motion.div {...fadeUp(0.32)} className="mt-7 flex flex-wrap items-center gap-3">
              <Motion.a
                href="/contact"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.38)] transition-shadow duration-300 hover:shadow-[0_0_32px_rgba(59,130,246,0.55)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Let's Talk
              </Motion.a>
              <Motion.a
                href="/projects"
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.07)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-200 transition-colors duration-200"
              >
                My Work
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Motion.a>
            </Motion.div>
          </div>
        </div>
      </section>

      {/* Rate This Portfolio */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="mt-6 md:mt-12 flex justify-center"
      >
        <button
          onClick={() => {
            navigate('/contact')
            setTimeout(() => {
              document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })
            }, 300)
          }}
          className="group relative flex items-center gap-2 md:gap-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-[11px] md:px-8 md:py-4 md:text-sm font-bold tracking-widest text-white uppercase shadow-[0_0_40px_rgba(79,142,247,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(79,142,247,0.5)] lg:text-base overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] group-hover:bg-[position:-200%_0,0_0] group-hover:duration-[1500ms]" />
          <span className="text-lg md:text-xl transition-transform group-hover:rotate-12">⭐</span>
          <span className="relative z-10">Rate This Portfolio</span>
        </button>
      </Motion.div>

      {/* ══════════════════════════════════════════════════
          FEATURED WORK
      ══════════════════════════════════════════════════ */}
      <Motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="mt-10 md:mt-24 flex flex-col gap-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">Featured Work</h2>
            <p className="mt-2 text-sm text-slate-400">A curated selection of technical solutions and creative builds.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-2"
          >
            Browse all projects <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Stacked project cards — one per row */}
        <div className="flex flex-col gap-5">
          {featuredProjects.map((proj, idx) => (
            <ProjectCard key={proj.id ?? idx} proj={proj} index={idx} />
          ))}
        </div>
      </Motion.section>

      {/* Technical Mastery */}
      <Motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="mt-20 md:mt-28 flex flex-col items-center gap-8"
      >
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">Technical Mastery</h2>
          <p className="mt-2 text-sm text-slate-400">A comprehensive overview of my technical stack and specialized tools.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {(technicalMastery || []).map((cat, idx) => (
            <div key={idx} className="rounded-[1.5rem] border border-white/8 bg-[#0b1120] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-slate-300">{masteryIcons[cat.icon] || masteryIcons.frontend}</span>
                <h3 className="font-heading text-lg font-bold text-white">{cat.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {cat.skills.map(skill => (
                  <div key={skill} className="flex items-center gap-2 rounded bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 tracking-wider">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Motion.section>

      {/* CTA */}
      <Motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="mt-24 mb-12 flex flex-col items-center text-center gap-6"
      >
        <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">Let's Build Something Great</h2>
        <p className="max-w-xl text-sm text-slate-400">Available for freelance projects and full-time opportunities. Drop a message to start a conversation.</p>
        <a href="/contact" className="mt-2 rounded-xl bg-[#5E6AD2] hover:bg-indigo-500 transition-colors px-8 py-3.5 text-sm font-semibold text-white shadow-lg">
          Send Message
        </a>
      </Motion.section>

      {/* Footer */}
      <footer className="mt-4 border-t border-white/10 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        <p>Dev.Core | &copy; 2026 Developer Portfolio...</p>
        <div className="flex gap-6">
          <a href="https://github.com/Teerath-Pant" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">GitHub</a>
          <a href="https://www.linkedin.com/in/teerath-pant-49461033b/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">LinkedIn</a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Source Code</a>
        </div>
      </footer>

    </div>
  )
}