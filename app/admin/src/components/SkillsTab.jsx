function SkillRow({ skill, index, onChange, onRemove }) {
  const value = Number(skill.value) || 0

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px auto', gap: '0.6rem', alignItems: 'end' }}>
        <div>
          <label className="label">Skill</label>
          <input
            type="text"
            className="field"
            value={skill.label}
            onChange={e => onChange({ ...skill, label: e.target.value })}
            placeholder="React"
          />
        </div>
        <div>
          <label className="label">Level</label>
          <input
            type="number"
            min="0"
            max="100"
            className="field"
            value={value}
            onChange={e => onChange({ ...skill, value: Number(e.target.value) })}
            placeholder="90"
          />
        </div>
        <button onClick={onRemove} className="btn btn-danger" style={{ padding: '0.6rem 0.7rem' }}>
          X
        </button>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={e => onChange({ ...skill, value: Number(e.target.value) })}
        style={{ marginTop: '0.85rem' }}
        aria-label={`Level for ${skill.label || `skill ${index + 1}`}`}
      />
    </div>
  )
}

function EnhancementEditor({ items, onChange, placeholder = "Future enhancement" }) {
  function update(index, value) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="field"
            value={item}
            onChange={e => update(index, e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="btn btn-danger"
            style={{ padding: '0.5rem 0.625rem', flexShrink: 0 }}
          >
            X
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
          No enhancements added yet.
        </div>
      )}
    </div>
  )
}

function MasteryCategoryEditor({ category, index, onChange, onRemove }) {
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.6rem', alignItems: 'end', marginBottom: '1rem' }}>
        <div>
          <label className="label">Category Title</label>
          <input
            type="text"
            className="field"
            value={category.title}
            onChange={e => onChange({ ...category, title: e.target.value })}
            placeholder="Frontend"
          />
        </div>
        <div>
          <label className="label">Icon Style</label>
          <select 
            className="field" 
            value={category.icon} 
            onChange={e => onChange({ ...category, icon: e.target.value })}
            style={{ appearance: 'auto', background: 'var(--bg)', color: '#fff' }}
          >
            <option value="frontend">Frontend (Grid)</option>
            <option value="backend">Backend (Database)</option>
            <option value="devops">DevOps (Layers)</option>
          </select>
        </div>
        <button onClick={onRemove} className="btn btn-danger" style={{ padding: '0.6rem 0.7rem' }}>
          X
        </button>
      </div>

      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="label" style={{ marginBottom: 0 }}>Skills</label>
        <button 
          onClick={() => onChange({ ...category, skills: [...category.skills, ''] })}
          className="btn btn-ghost" 
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
        >
          + Add Skill
        </button>
      </div>
      <EnhancementEditor 
        items={category.skills} 
        onChange={skills => onChange({ ...category, skills })} 
        placeholder="e.g. REACT" 
      />
    </div>
  )
}

export default function SkillsTab({ data, setData }) {
  function setKey(key, value) {
    setData(d => ({ ...d, [key]: value }))
  }

  function updateSkill(index, value) {
    const next = [...data.skillLevels]
    next[index] = value
    setKey('skillLevels', next)
  }

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Skill Levels</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{data.skillLevels.length} skills</p>
          </div>
          <button
            onClick={() => setKey('skillLevels', [...data.skillLevels, { label: 'New Skill', value: 75 }])}
            className="btn btn-primary"
            style={{ fontSize: '0.78rem' }}
          >
            + Add Skill
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {data.skillLevels.map((skill, index) => (
            <SkillRow
              key={index}
              skill={skill}
              index={index}
              onChange={value => updateSkill(index, value)}
              onRemove={() => setKey('skillLevels', data.skillLevels.filter((_, i) => i !== index))}
            />
          ))}
          {data.skillLevels.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
              No skills yet. Click "Add Skill" to start.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Future Enhancements</h3>
          <button
            onClick={() => setKey('futureEnhancements', [...data.futureEnhancements, ''])}
            className="btn btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            + Add
          </button>
        </div>
        <EnhancementEditor items={data.futureEnhancements} onChange={value => setKey('futureEnhancements', value)} />
      </div>

      {/* Technical Mastery Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Technical Mastery</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Homepage skills overview</p>
          </div>
          <button
            onClick={() => setKey('technicalMastery', [...(data.technicalMastery || []), { title: 'New Category', icon: 'frontend', skills: [] }])}
            className="btn btn-primary"
            style={{ fontSize: '0.78rem' }}
          >
            + Add Category
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(data.technicalMastery || []).map((cat, index) => (
            <MasteryCategoryEditor
              key={index}
              category={cat}
              index={index}
              onChange={updated => {
                const next = [...data.technicalMastery]
                next[index] = updated
                setKey('technicalMastery', next)
              }}
              onRemove={() => {
                setKey('technicalMastery', data.technicalMastery.filter((_, i) => i !== index))
              }}
            />
          ))}
          {(!data.technicalMastery || data.technicalMastery.length === 0) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
              No technical mastery categories. Click "Add Category" to start.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
