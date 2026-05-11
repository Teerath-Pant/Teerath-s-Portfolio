import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import Card from '../components/Card'
import FeedbackForm from '../components/FeedbackForm'
import { socials } from '../data/portfolioData'

const iconMap = {
  email: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  linkedin: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  github: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
    color: 'text-slate-300',
    bg: 'bg-white/5 border-white/10',
  },
  twitter: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.857L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  }
}

export default function ContactPage({ trackContactClick }) {
  const [sent, setSent] = useState(false)

  return (
    <div className="space-y-4 pb-4 md:space-y-8">
      {/* Header */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="section-header p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem]"
      >
        <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--accent-soft)] uppercase md:text-xs">Contact</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-white sm:text-3xl md:text-5xl">Get In Touch</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400 md:text-lg md:leading-8">
          Whether it's a project, opportunity, or just a hello — I'd love to hear from you.
        </p>
      </Motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:gap-8 items-start">
        {/* Contact form */}
        <Card eyebrow="Send a message" title="Let's talk">
          {sent ? (
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <span className="text-4xl md:text-5xl">✅</span>
              <p className="text-base font-medium text-emerald-400 md:text-lg">Message sent! I'll get back to you soon.</p>
            </Motion.div>
          ) : (
            <form
              className="space-y-4 md:space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                trackContactClick?.('contact_form')
                setSent(true)
              }}
            >
              <input
                type="text"
                placeholder="Your name"
                required
                className="form-input text-base py-3 md:py-4"
              />
              <input
                type="email"
                placeholder="Email address"
                required
                className="form-input text-base py-3 md:py-4"
              />
              <textarea
                rows="5"
                placeholder="Tell me about your project..."
                required
                className="form-input resize-none text-base py-3 md:py-4"
              />
              <button
                type="submit"
                className="w-full rounded-[1.25rem] bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3.5 md:py-4 text-sm md:text-base font-semibold tracking-[0.12em] text-white uppercase shadow-lg shadow-blue-500/20 transition-all duration-200 hover:brightness-110 hover:shadow-blue-500/35 active:scale-[0.98]"
              >
                Send Message ↗
              </button>
            </form>
          )}
        </Card>

        {/* Social links */}
        <Card eyebrow="Elsewhere" title="Social & Links">
          <div className="space-y-3 md:space-y-4">
            {socials.map((link) => {
              const style = iconMap[link.platform] || iconMap.email;
              const displayValue = link.href.replace('mailto:', '').replace('https://', '').replace('http://', '').replace('www.', '');
              return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContactClick?.(link.platform)}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 md:px-5 md:py-4 transition-all duration-200 hover:scale-[1.02] hover:brightness-110 ${style.bg}`}
              >
                <span className={`shrink-0 ${style.color}`}>{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase md:text-[11px]">{link.label}</p>
                  <p className="mt-1 truncate text-xs font-medium text-white sm:text-sm md:text-base">{displayValue}</p>
                </div>
                <span className="shrink-0 text-slate-500">↗</span>
              </a>
            )})}
          </div>
        </Card>
      </div>
      
      {/* Feedback Section */}
      <div id="feedback-section" className="pt-4 md:pt-6">
        <FeedbackForm />
      </div>
    </div>
  )
}
