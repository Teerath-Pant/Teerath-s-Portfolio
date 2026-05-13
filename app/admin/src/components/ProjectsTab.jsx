import { useState } from 'react'

const TAG_OPTIONS = ['Full Stack', 'UI/UX', 'Backend', 'Frontend', 'AI', 'Mobile', 'Open Source', 'Other']
const TAG_COLORS = {
  'Full Stack': '#4f8ef7', 'UI/UX': '#a78bfa', 'Backend': '#34d399',
  'Frontend': '#38bdf8', 'AI': '#f59e0b', 'Mobile': '#fb7185',
  'Open Source': '#22c55e', 'Other': '#94a3b8',
}

function ProjectCard({ project, index, onChange, onRemove }) {
  const [open, setOpen] = useState(false)
  const color = TAG_COLORS[project.tag] ?? '#4f8ef7'

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer' }}
      >
        <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: '99px', padding: '0.15rem 0.6rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
          {project.tag}
        </span>
        <span style={{ flex: 1, color: '#fff', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.title || 'Untitled Project'}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onRemove() }} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}>✕</button>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded fields */}
      {open && (
        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginTop: '0.75rem' }}>
            <label className="label">Title</label>
            <input type="text" className="field" value={project.title} onChange={e => onChange({ ...project, title: e.target.value })} placeholder="Project title" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="field" rows={2} value={project.description} onChange={e => onChange({ ...project, description: e.target.value })} placeholder="Short project description" />
          </div>
          <div>
            <label className="label">Link / URL</label>
            <input type="text" className="field" value={project.link} onChange={e => onChange({ ...project, link: e.target.value })} placeholder="https://github.com/..." />
          </div>
          <div>
            <label className="label">Project Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {(project.images || []).map((imgUrl, imgIdx) => (
                <div key={imgIdx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => {
                      const newImgs = [...project.images]
                      newImgs.splice(imgIdx, 1)
                      onChange({ ...project, images: newImgs })
                    }}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                </div>
              ))}
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="field" 
              style={{ padding: '0.4rem', fontSize: '0.75rem' }}
              onChange={async e => {
                const files = Array.from(e.target.files)
                if (!files.length) return
                
                const newImages = [...(project.images || [])]
                for (const file of files) {
                  const reader = new FileReader()
                  const dataUrl = await new Promise(res => {
                    reader.onload = () => res(reader.result)
                    reader.readAsDataURL(file)
                  })
                  
                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name, data: dataUrl })
                  })
                  const result = await response.json()
                  if (result.ok) newImages.push(result.url)
                }
                onChange({ ...project, images: newImages })
                e.target.value = ''
              }} 
            />
          </div>
          <div>
            <label className="label">Tag</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => onChange({ ...project, tag })}
                  style={{
                    padding: '0.25rem 0.7rem', borderRadius: '99px', border: `1px solid ${project.tag === tag ? TAG_COLORS[tag] + '80' : 'var(--border)'}`,
                    background: project.tag === tag ? TAG_COLORS[tag] + '22' : 'transparent',
                    color: project.tag === tag ? TAG_COLORS[tag] : 'var(--muted)',
                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >{tag}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectsTab({ data, setData }) {
  function updateProject(i, val) {
    const arr = [...data.projectCards]; arr[i] = val
    setData(d => ({ ...d, projectCards: arr }))
  }
  function removeProject(i) { setData(d => ({ ...d, projectCards: d.projectCards.filter((_, idx) => idx !== i) })) }
  function addProject() {
    setData(d => ({
      ...d,
      projectCards: [...d.projectCards, { title: 'New Project', description: 'Project description', tag: 'Full Stack', link: '#' }],
    }))
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Project Cards</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{data.projectCards.length} projects</p>
          </div>
          <button onClick={addProject} className="btn btn-primary" style={{ fontSize: '0.78rem' }}>
            + Add Project
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.projectCards.map((project, i) => (
            <ProjectCard key={i} project={project} index={i} onChange={v => updateProject(i, v)} onRemove={() => removeProject(i)} />
          ))}
          {data.projectCards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
              No projects yet. Click "Add Project" to start.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
