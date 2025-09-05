import { Resume, ResumeSchema } from '../schema/resume';

const STORAGE_KEY = 'tailorcv.resume';

export function loadResume(): Resume | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return ResumeSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function saveResume(resume: Resume) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
}

export function clearResume() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportResume(resume: Resume): string {
  return JSON.stringify(resume, null, 2);
}

export function importResume(json: string): Resume {
  const parsed = JSON.parse(json);
  return ResumeSchema.parse(parsed);
}
