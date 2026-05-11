function Field({ label, value, onChange, type = 'text', placeholder = '', rows }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className="label">{label}</label>
      {rows ? (
        <textarea className="field" rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} className="field" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
}

export default function ProfileTab({ data, setData }) {
  const p = data.profile
  const set = (key, val) => setData(d => ({ ...d, profile: { ...d.profile, [key]: val } }))
  const setStat = (i, key, val) => setData(d => {
    const stats = [...d.stats]; stats[i] = { ...stats[i], [key]: val }; return { ...d, stats }
  })
  const addStat = () => setData(d => ({ ...d, stats: [...d.stats, { value: '', label: '' }] }))
  const removeStat = (i) => setData(d => ({ ...d, stats: d.stats.filter((_, idx) => idx !== i) }))

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Identity */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: '1rem', color: '#fff', fontSize: '0.95rem' }}>
          Identity
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Field label="Full Name"   value={p.name}     onChange={v => set('name', v)}     placeholder="Your Name" />
          <Field label="Job Title"   value={p.title}    onChange={v => set('title', v)}    placeholder="Full Stack Developer" />
          <Field label="Location"    value={p.location} onChange={v => set('location', v)} placeholder="City, Country" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          <label className="label" style={{ margin: 0 }}>Available for work</label>
          <button
            onClick={() => set('availableForWork', !p.availableForWork)}
            style={{
              width: '40px', height: '22px', borderRadius: '99px', border: 'none', cursor: 'pointer',
              background: p.availableForWork ? 'rgba(52,211,153,0.8)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: '3px', left: p.availableForWork ? '21px' : '3px',
              width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', display: 'block',
            }} />
          </button>
          <span style={{ fontSize: '0.78rem', color: p.availableForWork ? 'var(--success)' : 'var(--muted)' }}>
            {p.availableForWork ? 'Active' : 'Hidden'}
          </span>
        </div>
      </div>

      {/* Hero copy */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: '1rem', color: '#fff', fontSize: '0.95rem' }}>
          Hero Section Copy
        </h3>
        <Field label="Main Headline" value={p.headline} onChange={v => set('headline', v)} placeholder="Transforming Your Ideas into Reality" />
        <Field label="Subtext"       value={p.subtext}  onChange={v => set('subtext', v)}  placeholder="Short bio paragraph…" rows={3} />
      </div>

      {/* Stats */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, margin: 0, color: '#fff', fontSize: '0.95rem' }}>
            Stats
          </h3>
          <button onClick={addStat} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
            + Add Stat
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {data.stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid var(--border)', position: 'relative' }}>
              <button 
                onClick={() => removeStat(i)}
                style={{ position: 'absolute', top: '0.4rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                title="Remove stat"
              >
                ×
              </button>
              <Field label="Value" value={s.value} onChange={v => setStat(i, 'value', v)} placeholder="+12" />
              <Field label="Label" value={s.label} onChange={v => setStat(i, 'label', v)} placeholder="Projects\nCompleted" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
