import { useEffect, useRef } from 'react'
import { motion as Motion } from 'framer-motion'
import { animate, stagger } from 'animejs'
import AppIcon from '../components/AppIcon'
import { appScreens, dockApps } from '../data/portfolioData'
import profileImage from '../assets/images/profile.png'

export default function HomePage({ now }) {
  const gridRef = useRef(null)

  useEffect(() => {
    if (!gridRef.current) return undefined

    const icons = gridRef.current.querySelectorAll('.app-icon-tile')
    const items = gridRef.current.querySelectorAll('.home-grid-item')

    const revealAnimation = animate(items, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(65),
      duration: 450,
      ease: 'outCubic',
    })

    const floatAnimation = animate(icons, {
      translateY: ['0rem', '-0.35rem'],
      delay: stagger(120, { start: 400 }),
      duration: 2000,
      ease: 'inOutSine',
      alternate: true,
      loop: true,
    })

    return () => {
      revealAnimation.pause()
      floatAnimation.pause()
    }
  }, [])

  const currentWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now)
  const currentDay = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(now)
  const currentMonth = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now)

  return (
    <div className="relative flex min-h-full flex-col gap-7 md:gap-12">
      <Motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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

      <Motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto hidden w-full overflow-hidden rounded-[2.5rem] border border-white/6 bg-gradient-to-br from-[rgba(79,142,247,0.12)] to-[rgba(129,140,248,0.06)] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md md:block lg:p-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,142,247,0.15),transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-blue-400/70 uppercase lg:text-sm">{currentWeekday}</p>
            <h1 className="mt-2 font-heading text-6xl font-bold text-white lg:text-7xl">{currentDay}</h1>
            <p className="mt-2 text-xl text-slate-400">{currentMonth}</p>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 lg:text-lg lg:leading-8">
              Welcome to my interactive portfolio - designed with a responsive, Android OS-inspired theme for a seamless browsing experience across all devices.
            </p>
          </div>
          <div
            className="h-32 w-32 shrink-0 overflow-hidden rounded-[2.5rem] border border-white/15 bg-cover bg-center shadow-2xl lg:h-40 lg:w-40"
            style={{ backgroundImage: `url(${profileImage})` }}
          />
        </div>
      </Motion.section>

      <section className="md:flex md:flex-col md:items-center">
        <p className="mb-4 text-center text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase md:mb-6 md:text-[11px] lg:text-xs">Navigate</p>
        <div ref={gridRef} className="mx-auto grid w-full max-w-[23rem] grid-cols-4 content-start gap-x-2 gap-y-6 px-1 sm:max-w-[28rem] sm:gap-x-4 sm:gap-y-8 md:max-w-fit md:gap-x-12 md:gap-y-10 md:px-0 lg:gap-x-16">
          {appScreens.map((screen) => (
            <div key={`${screen.label}-${screen.icon}`} className="home-grid-item flex justify-center">
              <AppIcon {...screen} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center pb-4 md:pb-0">
        <p className="mb-4 text-[10px] font-semibold tracking-[0.28em] text-slate-500 uppercase md:mb-6 md:text-[11px] lg:text-xs">Quick access</p>
        <div className="w-full max-w-[22rem] rounded-[2rem] border border-white/10 bg-white/5 px-3 py-3 shadow-lg backdrop-blur-xl sm:max-w-[26rem] sm:px-4 sm:py-4 md:inline-block md:w-auto md:max-w-none md:rounded-[2.5rem] md:px-8 md:py-5">
          <div className="flex justify-around gap-2 px-1 sm:gap-4 md:gap-10 md:px-2">
            {dockApps.map((screen) => (
              <div key={`${screen.label}-${screen.icon}`} className="flex justify-center">
                <AppIcon {...screen} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
