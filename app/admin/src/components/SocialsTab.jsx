const PLATFORM_OPTIONS = ['github', 'linkedin', 'twitter', 'email', 'website', 'instagram', 'youtube', 'other']

function SocialRow({ social, onChange, onRemove }) {
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.75rem' }}>
        <div>
          <label className="label">Label</label>
          <input
            type="text"
            className="field"
            value={social.label}
            onChange={e => onChange({ ...social, label: e.target.value })}
            placeholder="GitHub"
          />
        </div>
        <div>
          <label className="label">URL</label>
          <input
            type="text"
            className="field"
            value={social.href}
            onChange={e => onChange({ ...social, href: e.target.value })}
            placeholder="https://github.com/username"
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginTop: '0.85rem' }}>
        <div style={{ flex: 1 }}>
          <label className="label">Platform</label>
          <select
            className="field"
            value={social.platform}
            onChange={e => onChange({ ...social, platform: e.target.value })}
          >
            {PLATFORM_OPTIONS.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
        <button onClick={onRemove} className="btn btn-danger" style={{ padding: '0.6rem 0.7rem' }}>
          Remove
        </button>
      </div>
    </div>
  )
}

export default function SocialsTab({ data, setData }) {
  function setSocials(socials) {
    setData(d => ({ ...d, socials }))
  }

  function updateSocial(index, value) {
    const next = [...data.socials]
    next[index] = value
    setSocials(next)
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Social Links</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{data.socials.length} links</p>
          </div>
          <button
            onClick={() => setSocials([...data.socials, { label: 'Website', href: '#', platform: 'website' }])}
            className="btn btn-primary"
            style={{ fontSize: '0.78rem' }}
          >
            + Add Link
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {data.socials.map((social, index) => (
            <SocialRow
              key={index}
              social={social}
              onChange={value => updateSocial(index, value)}
              onRemove={() => setSocials(data.socials.filter((_, i) => i !== index))}
            />
          ))}
          {data.socials.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
              No social links yet. Click "Add Link" to start.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
