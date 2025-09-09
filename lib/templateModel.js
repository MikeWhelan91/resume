function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return String(s)
  return d.toLocaleString('en-GB', { month: 'short', year: 'numeric' })
}

function joinLocation(item) {
  const parts = [item.city, item.region, item.country].filter(Boolean)
  return parts.join(', ')
}

function normalizeExperience(items = []) {
  return items.map(x => ({
    title: x.title || x.position || '',
    company: typeof x.company === 'string' ? x.company : (x.company?.name || x.employer || ''),
    location: x.location || joinLocation(x),
    start: fmtDate(x.startDate || x.start),
    end: (x.endDate || x.end) ? fmtDate(x.endDate || x.end) : 'Present',
    bullets: Array.isArray(x.bullets) ? x.bullets
        : Array.isArray(x.highlights) ? x.highlights
        : Array.isArray(x.points) ? x.points
        : [],
  }))
}

function normalizeEducation(items = []) {
  return items.map(x => ({
    institution: typeof x.institution === 'string' ? x.institution : (x.institution?.name || ''),
    area: x.area || x.studyType || x.degree || '',
    start: fmtDate(x.startDate || x.start),
    end: fmtDate(x.endDate || x.end),
  }))
}

export function toTemplateModel(appData, { ats, density } = {}) {
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })
  const cover = appData.coverLetter || {}

  const bodyHtml = (cover.body || '')
    .split(/\n{2,}/).map(p => `<p>${p.trim().replace(/\n/g,'<br/>')}</p>`).join('')

  return {
    ...appData,
    experience: normalizeExperience(appData.experience || appData.work || []),
    education: normalizeEducation(appData.education || []),
    skills: Array.isArray(appData.skills) ? appData.skills
          : Array.isArray(appData.skillsList) ? appData.skillsList
          : [],
    coverLetter: { ...cover, bodyHtml },
    today,
    ats: !!ats,
    density: density || 'Normal',
  }
}
