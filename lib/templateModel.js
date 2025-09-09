export function toTemplateModel(appData){
  // Map from your existing data shape (resume + cover letter) into a stable model.
  // Inspect the repo to pull the correct fields; do not invent names.
  const basics = appData.basics || appData.profile || {}
  const experience = (appData.experience || appData.work || []).map(x => ({
    company: x.company || x.employer || '',
    title: x.title || x.position || '',
    start: x.startDate || x.start || '',
    end: x.endDate || x.end || 'Present',
    bullets: x.highlights || x.bullets || []
  }))
  const education = (appData.education || []).map(x => ({
    institution: x.institution || x.school || '',
    area: x.area || x.degree || '',
    start: x.startDate || x.start || '',
    end: x.endDate || x.end || ''
  }))
  const skills = (appData.skills || []).map(s => (s.keywords || s.items || [s.name]).flat()).flat().filter(Boolean)

  return {
    name: basics.name || '',
    label: basics.label || basics.title || '',
    email: basics.email || '',
    phone: basics.phone || '',
    url: basics.url || basics.website || '',
    location: basics.location || {},
    summary: basics.summary || '',
    skills,
    experience,
    education,
    links: appData.links || [],
    meta: { accent: appData.accent || '#00C9A7', density: appData.density || 'normal', ats: !!appData.ats }
  }
}
