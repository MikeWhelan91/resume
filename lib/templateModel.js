function fmtDate(s){
  if(!s) return '';
  const d = new Date(s);
  if(Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString('en-GB', { month:'short', year:'numeric' });
}
function joinLoc(x){
  return [x.city, x.region, x.country].filter(Boolean).join(', ');
}
function normWork(arr=[]){
  return arr.map(x => ({
    title: x.title || x.position || '',
    company: typeof x.company==='string' ? x.company : (x.company?.name || x.employer || ''),
    location: x.location || joinLoc(x),
    start: fmtDate(x.startDate || x.start),
    end: (x.endDate||x.end) ? fmtDate(x.endDate||x.end) : 'Present',
    bullets: Array.isArray(x.bullets) ? x.bullets
      : Array.isArray(x.highlights) ? x.highlights
      : Array.isArray(x.points) ? x.points : [],
  }));
}
function normEdu(arr=[]){
  return arr.map(x => ({
    institution: typeof x.institution==='string' ? x.institution : (x.institution?.name || ''),
    area: x.area || x.studyType || x.degree || '',
    start: fmtDate(x.startDate || x.start),
    end: fmtDate(x.endDate || x.end),
  }));
}
export function toTemplateModel(data={}, { ats, density }={}){
  const cover = data.coverLetter || {};
  const bodyHtml = String(cover.body || '')
    .split(/\n{2,}/).map(p => `<p>${p.trim().replace(/\n/g,'<br/>')}</p>`).join('');
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  return {
    ...data,
    experience: normWork(data.experience || data.work || []),
    education: normEdu(data.education || []),
    skills: Array.isArray(data.skills) ? data.skills : (Array.isArray(data.skillsList)?data.skillsList:[]),
    coverLetter: { ...cover, bodyHtml },
    today,
    ats: !!ats,
    density: density || 'Normal',
  };
}
