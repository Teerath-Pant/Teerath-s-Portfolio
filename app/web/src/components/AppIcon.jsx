import { NavLink } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'

export default function AppIcon({ to, label, icon, color }) {
  return (
    <NavLink to={to} className="block w-full">
      {({ isActive }) => (
        <Motion.div
          whileHover={{ y: -5, scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="flex flex-col items-center text-center w-full"
        >
          <div
            className={`app-icon-tile relative flex items-center justify-center rounded-[1.4rem] border font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-200
              h-[3.75rem] w-[3.75rem] text-lg
              sm:h-[4.25rem] sm:w-[4.25rem] sm:text-xl sm:rounded-[1.6rem]
              md:h-[4.5rem] md:w-[4.5rem] md:rounded-[1.75rem]
              lg:h-[5rem] lg:w-[5rem] lg:text-2xl lg:rounded-[2rem]
              ${isActive
                ? 'border-white/60 ring-2 ring-white/25 ring-offset-1 ring-offset-transparent'
                : 'border-white/15 hover:border-white/30'
              }`}
            style={{ background: color }}
          >
            <span className="text-white drop-shadow-sm">{icon}</span>
            {isActive && (
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#111827] bg-blue-400" />
            )}
          </div>
          <p className="mt-2 text-[11px] font-medium leading-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:mt-2.5 sm:text-xs md:text-[13px] lg:text-sm">
            {label}
          </p>
        </Motion.div>
      )}
    </NavLink>
  )
}
