import { motion as Motion } from 'framer-motion'
import profileImage from '../assets/images/profile.png'
import nexusImg from '../assets/images/nexus.png'
import syncImg from '../assets/images/sync.png'
import auraImg from '../assets/images/aura.png'
import { profile, stats, socials } from '../data/portfolioData'

// ── Animation helpers ──────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut', delay },
})

// Map platform names to SVG icons
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

export default function HomePage({ now }) {

  const currentWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now)
  const currentDay = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(now)
  const currentMonth = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now)

  return (
    <div className="relative flex min-h-full flex-col gap-7 md:gap-10">

      {/* ══════════════════════════════════════════════════
          MOBILE HEADER  (hidden on md+)
      ══════════════════════════════════════════════════ */}
      <Motion.section
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.035] p-5 shadow-[0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-md md:hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,142,247,0.18),transparent_62%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-blue-300/80 uppercase">{currentWeekday}</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="font-heading text-5xl font-bold leading-none text-white">{currentDay}</p>
              <p className="pb-1 text-sm font-medium text-slate-400">{currentMonth}</p>
            </div>
          </div>
          <Motion.div
            whileTap={{ scale: 0.95 }}
            className="h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-[1.35rem] border border-white/15 bg-cover bg-center shadow-lg"
            style={{ backgroundImage: `url(${profileImage})` }}
          />
        </div>
        <div className="relative mt-5">
          <h2 className="font-heading text-xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Explore my work, skills, profile, and contact details through a clean mobile-first portfolio interface.
          </p>
        </div>
      </Motion.section>

      {/* ══════════════════════════════════════════════════
          DESKTOP HERO  (hidden below md)
          Layout: [Profile Card]  |  [Hero Text + Stats]
      ══════════════════════════════════════════════════ */}
      <section className="hidden md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-stretch">

        {/* ── LEFT: Profile Card ── */}
        <Motion.div {...fadeUp(0.05)} className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.035] backdrop-blur-md shadow-[0_18px_48px_rgba(2,6,23,0.22)] flex flex-col">

          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,142,247,0.12),transparent_65%)]" />

          {/* Profile image */}
          <div className="relative mx-auto mt-8 h-44 w-44 lg:h-52 lg:w-52 overflow-hidden rounded-[1.75rem] border border-white/12 bg-cover bg-center shadow-2xl"
            style={{ backgroundImage: `url(${profileImage})` }}
          >
            {/* Inner glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080e1c]/60 to-transparent" />
          </div>

          {/* Info */}
          <div className="relative flex flex-col items-center px-6 pb-6 pt-5 flex-1">
            <h2 className="font-heading text-xl lg:text-2xl font-bold text-white text-center leading-tight">{profile.name}</h2>
            <p className="mt-1 text-sm text-slate-400 text-center">{profile.title}</p>

            {/* Location pill */}
            <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[11px] font-medium text-slate-400">{profile.location}</span>
            </div>

            {/* Divider */}
            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                  className="group flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-slate-400 transition-all duration-200 hover:border-blue-500/35 hover:bg-blue-500/12 hover:text-blue-300 hover:-translate-y-0.5">
                  {socialIcons[s.platform] || socialIcons.email}
                </a>
              ))}
            </div>

            {/* CTA */}
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

        {/* ── RIGHT: Hero Text + Stats + CTAs ── */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/6 bg-gradient-to-br from-[rgba(79,142,247,0.1)] to-[rgba(129,140,248,0.05)] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col justify-center px-8 py-10 lg:px-12 lg:py-12">

          {/* Background radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,142,247,0.18),transparent_60%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />

          <div className="relative">
            {/* Date eyebrow */}
            <Motion.p {...fadeUp(0.1)} className="text-xs font-semibold tracking-[0.3em] text-blue-400/70 uppercase lg:text-sm">
              {currentWeekday} · {currentDay} {currentMonth}
            </Motion.p>

            {/* Big headline */}
            <Motion.h1 {...fadeUp(0.15)} className="mt-4 font-heading text-4xl font-extrabold leading-[1.1] text-white lg:text-5xl xl:text-6xl">
              {profile.headline}
            </Motion.h1>

            {/* Subtext */}
            <Motion.p {...fadeUp(0.2)} className="mt-5 max-w-xl text-sm leading-7 text-slate-400 lg:text-base lg:leading-8">
              {profile.subtext}
            </Motion.p>

            {/* Stats row */}
            <Motion.div {...fadeUp(0.25)} className="mt-8 flex items-center gap-6 lg:gap-10">
              {stats.map((s, i) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-heading text-center text-3xl font-extrabold text-white lg:text-4xl">{s.value}</span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 whitespace-pre-line leading-4">{s.label}</span>
                </div>
              ))}
              {/* Vertical dividers between stats */}
            </Motion.div>

            {/* Divider */}
            <Motion.div {...fadeUp(0.28)} className="mt-8 h-px w-full bg-gradient-to-r from-white/10 via-white/6 to-transparent" />

            {/* CTA buttons */}
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

      {/* ══════════════════════════════════════════════════
          SCROLL REVEAL SECTIONS 
      ══════════════════════════════════════════════════ */}
      
      {/* Featured Work Section */}
      <Motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="mt-10 md:mt-24 flex flex-col gap-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">Featured Work</h2>
            <p className="mt-2 text-sm text-slate-400">A curated selection of technical solutions and creative builds.</p>
          </div>
          <a href="/projects" className="text-sm font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-2">
            Browse all projects <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "NexusCloud",
              desc: "Enterprise-level cloud orchestration platform featuring real-time monitoring and automated deployment pipelines.",
              tags: ["REACT", "KUBERNETES", "AWS"],
              img: nexusImg,
            },
            {
              title: "SyncAPI",
              desc: "High-throughput data synchronization engine built for seamless integration between legacy systems and modern web apps.",
              tags: ["NODE.JS", "GRAPHQL", "REDIS"],
              img: syncImg,
            },
            {
              title: "Aura UI",
              desc: "An open-source design system and component library focused on accessibility and high-end developer experience.",
              tags: ["TYPESCRIPT", "TAILWIND", "FRAMER"],
              img: auraImg,
            }
          ].map((proj, idx) => (
            <Motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="flex flex-col overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#0b1120] shadow-lg transition-colors hover:bg-white/[0.04]"
            >
              <div className="h-48 w-full bg-cover bg-center border-b border-white/8" style={{ backgroundImage: `url(${proj.img})` }} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-white">{proj.title}</h3>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed flex-1">{proj.desc}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {proj.tags.map(tag => (
                    <span key={tag} className="rounded bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 tracking-wider">{tag}</span>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-white">
                  <a href="#" className="hover:text-blue-400 transition-colors">View Project</a>
                  <a href="#" className="hover:text-blue-400 transition-colors">GitHub</a>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>
      </Motion.section>

      {/* Technical Mastery Section */}
      <Motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="mt-20 md:mt-28 flex flex-col items-center gap-8"
      >
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">Technical Mastery</h2>
          <p className="mt-2 text-sm text-slate-400">A comprehensive overview of my technical stack and specialized tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            {
              title: "Frontend",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
              skills: ["REACT", "NEXT.JS", "TYPESCRIPT", "TAILWIND", "THREE.JS", "REDUX"]
            },
            {
              title: "Backend",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
              skills: ["NODE.JS", "PYTHON", "POSTGRES", "MONGODB", "REDIS", "PRISMA"]
            },
            {
              title: "DevOps/Tools",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>,
              skills: ["DOCKER", "AWS", "CI/CD", "GIT", "VERCEL", "FIGMA"]
            }
          ].map((cat, idx) => (
            <div key={idx} className="rounded-[1.5rem] border border-white/8 bg-[#0b1120] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-slate-300">{cat.icon}</span>
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

      {/* CTA Section */}
      <Motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
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
        <p>Dev.Core | &copy; 2024 Developer Portfolio... </p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-300 transition-colors">GitHub</a>
          <a href="#" className="hover:text-slate-300 transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Source Code</a>
        </div>
      </footer>

    </div>
  )
}