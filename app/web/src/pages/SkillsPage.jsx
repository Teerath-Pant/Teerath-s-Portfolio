import { useEffect, useRef } from 'react'
import { motion as Motion } from 'framer-motion'
import { animate, stagger } from 'animejs'
import Card from '../components/Card'

const skillColors = [
  { from: '#4f8ef7', to: '#818cf8', glow: 'rgba(79,142,247,0.45)' },
  { from: '#38bdf8', to: '#0ea5e9', glow: 'rgba(56,189,248,0.4)' },
  { from: '#c084fc', to: '#a855f7', glow: 'rgba(192,132,252,0.4)' },
  { from: '#34d399', to: '#10b981', glow: 'rgba(52,211,153,0.4)' },
  { from: '#fb923c', to: '#f97316', glow: 'rgba(251,146,60,0.4)' },
]

export default function SkillsPage({ portfolioData }) {
  const meterRef = useRef(null)
  const { futureEnhancements, skillLevels } = portfolioData

  useEffect(() => {
    if (!meterRef.current) return undefined

    const fills = meterRef.current.querySelectorAll('[data-skill-fill]')
    const labels = meterRef.current.querySelectorAll('[data-skill-item]')

    const fillAnimation = animate(fills, {
      width: (element) => element.dataset.level,
      delay: stagger(150),
      duration: 900,
      ease: 'outExpo',
    })

    const labelAnimation = animate(labels, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(130),
      duration: 400,
      ease: 'outCubic',
    })

    return () => {
      fillAnimation.pause()
      labelAnimation.pause()
    }
  }, [skillLevels])

  return (
    <div className="space-y-4 pb-4 md:space-y-8">
      {/* Header */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="section-header p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem]"
      >
        <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--accent-soft)] uppercase md:text-xs">Skills</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-white sm:text-3xl md:text-5xl">Technical Stack</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400 md:text-lg md:leading-8">
          My core frontend skills, visualized with animated progress indicators.
        </p>
      </Motion.div>

      {/* Grid wrapper for cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:gap-8 items-start">
        {/* Skill bars */}
        <Card eyebrow="Capabilities" title="Frontend strengths">
          <div ref={meterRef} className="space-y-6">
            {skillLevels.map((skill, i) => {
              const colors = skillColors[i % skillColors.length]
              return (
                <div key={skill.label} data-skill-item>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300 md:text-base">{skill.label}</span>
                    <span className="text-sm font-semibold text-white md:text-base">{skill.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/6 md:h-3">
                    <div
                      data-skill-fill
                      data-level={`${skill.value}%`}
                      className="h-full w-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                        boxShadow: `0 0 10px ${colors.glow}`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Future enhancements */}
        <Card eyebrow="Roadmap" title="Planned next steps">
          <ul className="space-y-4 md:space-y-5">
            {futureEnhancements.map((item, i) => (
              <li key={item} className="flex items-start gap-4">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold md:h-8 md:w-8 md:text-xs"
                  style={{
                    background: `linear-gradient(135deg, ${skillColors[i % skillColors.length].from}, ${skillColors[i % skillColors.length].to})`,
                    opacity: 0.85,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-400 md:text-base md:leading-loose">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
