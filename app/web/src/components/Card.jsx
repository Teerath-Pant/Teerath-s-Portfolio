export default function Card({ title, eyebrow, children, className = '', accent = false }) {
  return (
    <article
      className={`rounded-3xl border bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm md:rounded-[2.5rem] md:p-8 ${
        accent
          ? 'border-blue-500/20 bg-[rgba(79,142,247,0.05)]'
          : 'border-white/6'
      } ${className}`}
    >
      {eyebrow ? (
        <p className="text-[10px] font-semibold tracking-[0.25em] text-[var(--accent-soft)] uppercase md:text-xs">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-2 font-heading text-xl font-semibold text-white md:text-3xl">{title}</h2>
      ) : null}
      <div className={title || eyebrow ? 'mt-4 md:mt-6' : ''}>{children}</div>
    </article>
  )
}
