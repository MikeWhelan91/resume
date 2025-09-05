import { z } from 'zod';

export const ResumeSchema = z.object({
  basics: z.object({
    name: z.string(),
    headline: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    location: z.string().optional(),
  }),
  summary: z.string().optional(),
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
      keywords: z.array(z.string()).default([]),
    })
  ).default([]),
  work: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      location: z.string().optional(),
      start: z.string(),
      end: z.string().optional(),
      highlights: z.array(z.string()).default([]),
      tech: z.array(z.string()).default([]),
      achievements: z.array(z.string()).default([]),
    })
  ).default([]),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      highlights: z.array(z.string()).default([]),
    })
  ).default([]),
  projects: z.array(
    z.object({
      name: z.string(),
      summary: z.string().optional(),
      highlights: z.array(z.string()).default([]),
      tech: z.array(z.string()).default([]),
      link: z.string().url().optional(),
    })
  ).default([]),
  certifications: z.array(
    z.object({ name: z.string(), issuer: z.string().optional(), date: z.string().optional() })
  ).default([]),
  languages: z.array(
    z.object({ name: z.string(), level: z.string().optional() })
  ).default([]),
  volunteering: z.array(
    z.object({ org: z.string(), role: z.string().optional(), highlights: z.array(z.string()).default([]) })
  ).default([]),
  preferences: z.object({
    templateId: z.string().default('clean'),
    fontFamily: z.string().default('Inter'),
    color: z.string().default('#111827'),
    spacing: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
    sectionOrder: z.array(z.string()).optional(),
  }).default({}),
});

export type Resume = z.infer<typeof ResumeSchema>;
