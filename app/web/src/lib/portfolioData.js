import * as staticPortfolioData from '../data/portfolioData'

function isLegacyUploadImage(value) {
  if (typeof value !== 'string') return false

  return (
    value.startsWith('/api/uploads/') ||
    /\/api\/uploads\//i.test(value)
  )
}

// Admin may type "me@mail.com" or "github.com/me". Without a scheme the browser treats
// that as a relative URL (a broken page on this site), so add mailto: / https:// here.
function normalizeHref(href) {
  const h = typeof href === 'string' ? href.trim() : ''
  if (!h || h.startsWith('/') || h.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(h)) return h
  return h.includes('@') ? `mailto:${h}` : `https://${h}`
}

function sanitizeProjectCards(projectCards) {
  if (!Array.isArray(projectCards)) return staticPortfolioData.projectCards || []

  return projectCards.map((project, index) => ({
    ...project,
    showOnHome: typeof project?.showOnHome === 'boolean' ? project.showOnHome : index < 3,
    images: Array.isArray(project?.images)
      ? project.images.filter((image) => typeof image === 'string' && !isLegacyUploadImage(image))
      : [],
  }))
}

export function normalizePortfolioData(data = {}) {
  return {
    profile: {
      ...(staticPortfolioData.profile || {}),
      ...(data.profile || {}),
    },
    goals: Array.isArray(data.goals) ? data.goals : (staticPortfolioData.goals || []),
    audience: Array.isArray(data.audience) ? data.audience : (staticPortfolioData.audience || []),
    bioPoints: Array.isArray(data.bioPoints) ? data.bioPoints : (staticPortfolioData.bioPoints || []),
    projectCards: sanitizeProjectCards(
      Array.isArray(data.projectCards) ? data.projectCards : (staticPortfolioData.projectCards || [])
    ),
    skillLevels: Array.isArray(data.skillLevels) ? data.skillLevels : (staticPortfolioData.skillLevels || []),
    technicalMastery: Array.isArray(data.technicalMastery) ? data.technicalMastery : (staticPortfolioData.technicalMastery || []),
    futureEnhancements: Array.isArray(data.futureEnhancements) ? data.futureEnhancements : (staticPortfolioData.futureEnhancements || []),
    socials: (Array.isArray(data.socials) ? data.socials : (staticPortfolioData.socials || []))
      .map((s) => ({ ...s, href: normalizeHref(s?.href) })),
    stats: Array.isArray(data.stats) ? data.stats : (staticPortfolioData.stats || []),
  }
}

export function getFallbackPortfolioData() {
  return normalizePortfolioData(staticPortfolioData)
}
