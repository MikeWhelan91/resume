import { Resume } from '../schema/resume';

// Simple normalization: trim strings and ensure dates are yyyy-mm
export function normalizeResume(resume: Resume): Resume {
  const trim = (v: string | undefined) => (v ? v.trim() : v);
  const normDate = (d: string | undefined) => {
    if (!d) return d;
    const match = d.match(/(\d{4})[-/](\d{1,2})/);
    if (match) {
      const month = match[2].padStart(2, '0');
      return `${match[1]}-${month}`;
    }
    return d;
  };

  return {
    ...resume,
    basics: {
      ...resume.basics,
      name: trim(resume.basics.name)!,
      headline: trim(resume.basics.headline),
      email: trim(resume.basics.email)!,
      phone: trim(resume.basics.phone),
      links: resume.basics.links.map((l) => ({ label: trim(l.label)!, url: trim(l.url)! })),
      location: trim(resume.basics.location),
    },
    summary: trim(resume.summary),
    skills: resume.skills.map((s) => ({ ...s, name: trim(s.name)!, keywords: s.keywords.map((k) => k.trim()) })),
    work: resume.work.map((w) => ({
      ...w,
      company: trim(w.company)!,
      role: trim(w.role)!,
      location: trim(w.location),
      start: normDate(trim(w.start)!)!,
      end: normDate(trim(w.end)),
      highlights: w.highlights.map((h) => h.trim()),
      tech: w.tech.map((t) => t.trim()),
      achievements: w.achievements.map((a) => a.trim()),
    })),
    education: resume.education.map((e) => ({
      ...e,
      school: trim(e.school)!,
      degree: trim(e.degree),
      start: normDate(trim(e.start)),
      end: normDate(trim(e.end)),
      highlights: e.highlights.map((h) => h.trim()),
    })),
    projects: resume.projects.map((p) => ({
      ...p,
      name: trim(p.name)!,
      summary: trim(p.summary),
      highlights: p.highlights.map((h) => h.trim()),
      tech: p.tech.map((t) => t.trim()),
      link: trim(p.link),
    })),
    certifications: resume.certifications.map((c) => ({
      name: trim(c.name)!,
      issuer: trim(c.issuer),
      date: normDate(trim(c.date)),
    })),
    languages: resume.languages.map((l) => ({ name: trim(l.name)!, level: trim(l.level) })),
    volunteering: resume.volunteering.map((v) => ({
      org: trim(v.org)!,
      role: trim(v.role),
      highlights: v.highlights.map((h) => h.trim()),
    })),
    preferences: {
      ...resume.preferences,
      templateId: trim(resume.preferences.templateId) || 'clean',
      fontFamily: trim(resume.preferences.fontFamily) || 'Inter',
      color: trim(resume.preferences.color) || '#111827',
      spacing: resume.preferences.spacing,
      sectionOrder: resume.preferences.sectionOrder,
    },
  };
}
