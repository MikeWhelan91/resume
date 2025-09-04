import { z } from "zod";

export const GenFields = z.object({
  jobDesc: z.string().min(30, "Job description is too short.").max(20000, "Job description too long."),
  mode: z.enum(["default", "ats"]).default("default"),
  // tighten = how aggressive to shorten the outputs (0..2)
  tighten: z.preprocess(
    (v) => Number(Array.isArray(v) ? v[0] : v ?? 0),
    z.number().min(0).max(2)
  ),
});
