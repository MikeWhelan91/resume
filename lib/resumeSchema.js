import { z } from "zod";

export const ExperienceItem = z.object({
  company: z.string(),
  role: z.string(),
  start: z.string(),              // "2021-05"
  end: z.string().nullable(),     // null => Present
  bullets: z.array(z.string()).min(1),
  location: z.string().optional()
});

export const EducationItem = z.object({
  school: z.string(),
  degree: z.string(),
  start: z.string(),
  end: z.string(),
  grade: z.string().optional()
});

export const ResumeData = z.object({
  name: z.string(),
  title: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.array(ExperienceItem),
  education: z.array(EducationItem).default([])
});
