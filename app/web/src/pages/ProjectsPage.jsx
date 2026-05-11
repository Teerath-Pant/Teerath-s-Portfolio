import { motion as Motion } from 'framer-motion'
import Card from '../components/Card'
import { projectCards } from '../data/portfolioData'

const tagColors = {
  'App Grid': 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-300',
  'Profile': 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-300',
  'Cards': 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-300',
  'Progress': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-300',
}

export default function ProjectsPage({ trackProjectView }) {
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
          <Motion.div
            key={project.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: index * 0.09 }}
          >
            <article className="group h-full relative overflow-hidden rounded-[1.5rem] border border-white/6 bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04] md:p-6 md:rounded-[2rem]">
              {/* Subtle hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(79,142,247,0.08),transparent_70%)]" />

              <div className="relative flex h-full flex-col items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
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
                  href={project.link && project.link !== '#' ? project.link : "/contact"}
                  onClick={() => trackProjectView?.(project.title)}
                  className="mt-4 shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-semibold tracking-[0.15em] text-white/60 uppercase transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300 md:text-xs"
                >
                  View →
                </a>
              </div>
            </article>
          </Motion.div>
        ))}
      </div>
    </div>
  )
}
