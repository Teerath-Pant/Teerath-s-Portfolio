import { motion as Motion } from 'framer-motion'
import Card from '../components/Card'
import { audience, bioPoints, goals } from '../data/portfolioData'

export default function AboutPage() {
  return (
    <div className="space-y-4 pb-4 md:space-y-8">
      {/* Section header */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="section-header p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem]"
      >
        <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--accent-soft)] uppercase md:text-xs">About Me</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-white sm:text-3xl md:text-5xl">Developer & Designer</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400 md:text-lg md:leading-8">
          I craft interactive digital experiences with a focus on clean design,
          smooth animations, and performant code. This portfolio is designed as
          a mobile application interface — navigation through screens, not pages.
        </p>
      </Motion.div>

      {/* Bio grid */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6"
      >
        {bioPoints.map((point) => (
          <div
            key={point.label}
            className="flex items-start gap-4 rounded-2xl border border-white/6 bg-white/[0.025] p-4 md:p-5 md:flex-col md:items-center md:text-center md:gap-3 transition-all hover:bg-white/[0.04]"
          >
            <span className="text-xl md:text-2xl leading-none">{point.icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase md:text-xs">{point.label}</p>
              <p className="mt-1 text-xs font-medium text-white sm:text-sm md:text-base">{point.value}</p>
            </div>
          </div>
        ))}
      </Motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:gap-8 items-start">
        {/* Goals */}
        <Card eyebrow="Goals" title="Project Objectives">
          <ul className="space-y-3 text-sm text-slate-400 md:text-base">
            {goals.map((item) => (
              <li key={item} className="flex items-center gap-4">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(79,142,247,0.12)] text-blue-300 text-sm">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Audience */}
        <Card eyebrow="Audience" title="Built for the people reviewing your work">
          <ul className="space-y-3 text-sm text-slate-400 md:text-base">
            {audience.map((item) => (
              <li key={item} className="flex items-center gap-4">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(79,142,247,0.12)] text-blue-300 text-sm">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
