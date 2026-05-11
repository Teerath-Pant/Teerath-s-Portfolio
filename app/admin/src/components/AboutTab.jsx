function Field({ label, value, onChange, placeholder = '', rows }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label className="label">{label}</label>
      {rows
        ? <textarea className="field" rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input type="text" className="field" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  )
}

function ListEditor({ label, items, onChange, placeholder = 'Add item…' }) {
  function update(i, val) { const arr = [...items]; arr[i] = val; onChange(arr) }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)) }
  function add() { onChange([...items, '']) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="label" style={{ margin: 0 }}>{label}</label>
        <button onClick={add} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>+ Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem' }}>
            <input type="text" className="field" value={item} onChange={e => update(i, e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
            <button onClick={() => remove(i)} className="btn btn-danger" style={{ padding: '0.5rem 0.625rem', flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AboutTab({ data, setData }) {
  const setKey = (key, val) => setData(d => ({ ...d, [key]: val }))
  const setBioPoint = (i, field, val) => {
    const arr = [...data.bioPoints]; arr[i] = { ...arr[i], [field]: val }
    setKey('bioPoints', arr)
  }

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Bio grid points */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Bio Grid</h3>
          <button onClick={() => setKey('bioPoints', [...data.bioPoints, { icon: '🔥', label: 'New', value: 'Value' }])}
            className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>+ Add</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {data.bioPoints.map((pt, i) => (
            <div key={i} style={{ background: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid var(--border)', position: 'relative' }}>
              <button onClick={() => setKey('bioPoints', data.bioPoints.filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
              <Field label="Icon (emoji)" value={pt.icon}  onChange={v => setBioPoint(i, 'icon', v)}  placeholder="🎓" />
              <Field label="Label"        value={pt.label} onChange={v => setBioPoint(i, 'label', v)} placeholder="Education" />
              <Field label="Value"        value={pt.value} onChange={v => setBioPoint(i, 'value', v)} placeholder="Computer Science" />
            </div>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: '1rem', color: '#fff', fontSize: '0.95rem' }}>Audience List</h3>
        <ListEditor
          label="Who is this portfolio for?"
          items={data.audience}
          onChange={v => setKey('audience', v)}
          placeholder="Recruiters and hiring managers"
        />
      </div>

      {/* Goals */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: '1rem', color: '#fff', fontSize: '0.95rem' }}>Goals</h3>
        <ListEditor
          label="Portfolio goals"
          items={data.goals}
          onChange={v => setKey('goals', v)}
          placeholder="Create a clean, modern UI"
        />
      </div>

    </div>
  )
}
