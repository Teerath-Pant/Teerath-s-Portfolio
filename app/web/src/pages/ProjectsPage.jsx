import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { API_URL } from '../lib/api'

function getProjectHref(link) {
  if (!link || link === '#') return '/contact'
  return /^https?:\/\//i.test(link) ? link : `https://${link}`
}

const getImageUrl = (imgUrl) => {
  if (!imgUrl) return ''
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
    return imgUrl
  }
  return `${API_URL}${imgUrl}`
}

const tagColors = {
  'App Grid': 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-300',
  'Profile': 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-300',
  'Cards': 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-300',
  'Progress': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-300',
}

function ProjectCard({ project, index, trackProjectView }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const imgs = (project.images || []).filter(Boolean)
  const hasMany = imgs.length > 1

  const goImg = (e, d) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx((i) => (i + d + imgs.length) % imgs.length)
  }

  const handleDotClick = (e, ii) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx(ii)
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.09 }}
      className="group h-full relative"
    >
      <article className="group h-full relative overflow-hidden rounded-[1.5rem] border border-white/6 bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04] md:p-6 md:rounded-[2rem] flex flex-col gap-4">
        {/* Subtle hover glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(79,142,247,0.08),transparent_70%)]" />

        {/* Image slider container */}
        <div className="relative w-full h-44 sm:h-48 overflow-hidden rounded-xl border border-white/8 bg-white/5 shrink-0">
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
                  style={{ transform: zoomed && ii === imgIdx ? 'scale(1.08)' : 'scale(1)' }}
                />
              </div>
            )) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900/80 to-slate-950/90 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-600/80 group-hover:text-blue-500/50 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
            )}
          </div>

          {/* Gradient overlay */}
          {imgs.length > 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          )}

          {/* Arrows */}
          {hasMany && (
            <>
              {[-1, 1].map((d) => (
                <Motion.button
                  key={d}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={(e) => goImg(e, d)}
                  className="absolute top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white text-md backdrop-blur-sm hover:bg-black/80 transition-colors"
                  style={{ left: d === -1 ? '0.5rem' : 'auto', right: d === 1 ? '0.5rem' : 'auto' }}
                  aria-label={d === -1 ? 'Previous image' : 'Next image'}
                >
                  {d === -1 ? '‹' : '›'}
                </Motion.button>
              ))}
            </>
          )}

          {/* Dots */}
          {hasMany && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, ii) => (
                <Motion.button
                  key={ii}
                  onClick={(e) => handleDotClick(e, ii)}
                  animate={{ scale: ii === imgIdx ? 1.35 : 1, opacity: ii === imgIdx ? 1 : 0.4 }}
                  transition={{ duration: 0.2 }}
                  className="h-1.5 w-1.5 rounded-full bg-white border-none p-0 cursor-pointer"
                  aria-label={`Image ${ii + 1}`}
                />
              ))}
            </div>
          )}

          {/* Image counter */}
          {hasMany && (
            <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] text-white/75 backdrop-blur-sm">
              {imgIdx + 1} / {imgs.length}
            </span>
          )}
        </div>

        {/* Text Content */}
        <div className="relative flex flex-col justify-between flex-1 gap-4">
          <div className="min-w-0">
            {/* Tag */}
            <span
              className={`inline-flex items-center rounded-full border bg-gradient-to-r px-3 py-1 text-[9px] font-bold tracking-[0.22em] uppercase md:text-[11px] ${
                tagColors[project.tag] ?? 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-300'
              }`}
            >
              {project.tag}
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold text-white md:text-xl">{project.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400 md:text-base md:leading-7">{project.description}</p>
          </div>

          {/* View button */}
          <a
            href={getProjectHref(project.link)}
            onClick={() => trackProjectView?.(project.title)}
            className="mt-2 shrink-0 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-semibold tracking-[0.15em] text-white/60 uppercase transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300 md:text-xs"
          >
            View →
          </a>
        </div>
      </article>
    </Motion.div>
  )
}

export default function ProjectsPage({ portfolioData, trackProjectView }) {
  const { projectCards } = portfolioData

  return (
    <div className="space-y-4 pb-4 md:space-y-8">
      {/* Header */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="section-header p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem]"
      >
        <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--accent-soft)] uppercase md:text-xs">Projects</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-white sm:text-3xl md:text-5xl">Featured Work</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400 md:text-lg md:leading-8">
          Each section of this portfolio is its own screen, designed to feel like navigating a real mobile app.
        </p>
      </Motion.div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
        {projectCards.map((project, index) => (
          <ProjectCard
            key={`${project.id ?? project.title ?? 'project'}-${index}`}
            project={project}
            index={index}
            trackProjectView={trackProjectView}
          />
        ))}
      </div>
    </div>
  )
}
