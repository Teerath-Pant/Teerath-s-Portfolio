import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import Card from './Card'

export default function FeedbackForm() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('idle') // idle, submitting, success, error

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) {
      alert("Please select a rating before submitting.")
      return
    }

    setStatus('submitting')
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment, name }),
      })

      if (res.ok) {
        setStatus('success')
        setRating(0)
        setComment('')
        setName('')
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <Card eyebrow="Your opinion matters" title="Leave Feedback" id="feedback-form">
      {status === 'success' ? (
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-8 text-center"
        >
          <span className="text-4xl md:text-5xl">🎉</span>
          <p className="text-base font-medium text-emerald-400 md:text-lg">Thank you for your feedback!</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wider text-white/60 transition-all hover:bg-white/10"
          >
            Submit Another
          </button>
        </Motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <p className="text-sm font-semibold text-slate-300">How would you rate this portfolio?</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={(hoverRating || rating) >= star ? '#f59e0b' : 'transparent'}
                    stroke={(hoverRating || rating) >= star ? '#f59e0b' : '#64748b'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input text-base py-3 md:py-4"
          />
          <textarea
            rows="4"
            placeholder="Any comments, suggestions, or bugs found?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-input resize-none text-base py-3 md:py-4"
          />

          {status === 'error' && (
            <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full rounded-[1.25rem] bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 md:py-4 text-sm md:text-base font-semibold tracking-[0.12em] text-white uppercase shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:brightness-110 hover:shadow-emerald-500/35 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Feedback ↗'}
          </button>
        </form>
      )}
    </Card>
  )
}
