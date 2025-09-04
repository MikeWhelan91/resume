import os from "os";
import fs from "fs";
import crypto from "crypto";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";

import { normalizeResumeData } from "../../lib/normalizeResume";
import { enforceHeaderFromResume } from "../../lib/headerGuard";
import { prefilterResume } from "../../lib/textPrefilter";

export const config = { api: { bodyParser: false } };

// ------------- utils -------------
function firstFile(f) { return Array.isArray(f) ? f[0] : f; }

async function extractTextFromFile(file) {
  const f = firstFile(file); if (!f) return "";
  const p = f.filepath || f.path;
  const mime = (f.mimetype || f.type || "").toLowerCase();
  if (!p) return "";
  const buf = fs.readFileSync(p);
  if (mime.includes("pdf") || p.toLowerCase().endsWith(".pdf")) {
    const r = await pdfParse(buf); return r.text || "";
  }
  if (mime.includes("wordprocessingml") || p.toLowerCase().endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: buf }); return value || "";
  }
  return buf.toString("utf8");
}

function parseForm(req) {
  const form = formidable({ multiples: true, uploadDir: os.tmpdir(), keepExtensions: true, maxFileSize: 20 * 1024 * 1024 });
  return new Promise((resolve, reject) => form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files })));
}

function stripFence(s=""){ const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return m ? m[1] : s; }
function safeJSON(s){ try { return JSON.parse(stripFence(s)); } catch { return null; } }

// Apply model-provided replacements (case-insensitive, whole word)
function applyReplacements(text, replacements = []) {
  let out = String(text || "");
  for (const r of (replacements || [])) {
    const term = (r?.term || "").trim();
    const rep  = (r?.replacement || "").trim();
    if (!term || !rep) continue;
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, rep);
  }
  return out;
}

// ------------- handler -------------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  try {
    const { fields, files } = await parseForm(req);
    const resumeTextFull = await extractTextFromFile(files?.resume);
    const jobDesc = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : (fields?.jobDesc || "");

    if (!resumeTextFull) return res.status(400).json({ error: "No readable resume file", code: "E_NO_RESUME" });
    if (!jobDesc || jobDesc.trim().length < 30) return res.status(400).json({ error: "Job description too short", code: "E_BAD_INPUT" });

    // Token trimming to keep cost down (keep factual lines and section headers)
    const resumePref = prefilterResume(resumeTextFull, 3000);

    const SYSTEM = `
You are a structured writer that outputs ONLY strict JSON.
You must: (1) extract verifiable facts from the candidate's résumé, (2) extract concrete terms from the job description,
(3) derive a blocklist = JD items not in the résumé facts, (4) generate a tailored cover letter and a normalized résumé
that never mentions a blocklisted specific item, and (5) return an audit plus the replacements you applied.

Rules (MUST follow):
- Header fields (name, title, location, email, phone) MUST come ONLY from the résumé text.
- Do NOT copy or infer header fields from the JD. If missing in the résumé, omit them.
- Do NOT introduce employers, dates, certifications, awards, or tools/products that are not in the résumé.
- If the JD mentions a specific product/tool/system not present in the résumé facts, you MUST generalize it (e.g., "a design tool", "a CRM", "a cloud platform", "an EHR system", "a CAD tool") or omit it entirely. Do not name the product.
- Keep tone concise and professional.
- Output ONLY valid JSON. No prose outside JSON.

Return exactly this JSON shape:
{
  "resumeFacts": {
    "header": { "name": string?, "title": string?, "location": string?, "email": string?, "phone": string? },
    "employers": [ { "company": string, "role": string?, "start": string?, "end": string?, "location": string? } ],
    "tools": [string],
    "certifications": [string],
    "degrees": [string],
    "links": [ { "label": string, "url": string } ]
  },
  "jdTerms": [string],
  "blocklist": [string],
  "replacements": [ { "term": string, "replacement": string } ],
  "resumeData": {
    "header": { "name": string?, "title": string?, "location": string?, "email": string?, "phone": string? },
    "summary": string?,
    "skills": [string],
    "experience": [ { "company": string, "role": string?, "location": string?, "start": string?, "end": string?, "bullets": [string] } ],
    "education": [ { "line": string } ],
    "links": [ { "label": string, "url": string } ]
  },
  "coverLetter": string,
  "audit": {
    "usedTools": [string],
    "generalized": [ { "from": string, "to": string } ],
    "omitted": [string]
  }
}
`.trim();

    const USER = `
RESUME:
${resumePref}

---
JOB DESCRIPTION:
${jobDesc}

Constraints:
- Keep cover letter ~220–350 words.
- Do not exceed the schema. No markdown fences.
`.trim();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER }
      ],
      // If your account supports it, uncomment for stricter JSON:
      // response_format: { type: "json_object" }
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json) return res.status(502).json({ error: "Bad model output", code: "E_BAD_MODEL_OUTPUT", raw });

    // Pull outputs
    const replacements = Array.isArray(json.replacements) ? json.replacements : [];
    const resumeRaw = json.resumeData || {};
    let coverLetter = String(json.coverLetter || "");

    // Apply model's own replacements again server-side (belt-and-braces)
    coverLetter = applyReplacements(coverLetter, replacements);

    // Normalize + header guard (resume-only for header fields)
    const resumeDataNormalized = normalizeResumeData(resumeRaw);
    const resumeData = enforceHeaderFromResume(resumeDataNormalized, resumeTextFull);

    return res.status(200).json({
      resumeData,
      coverLetter,
      audit: json.audit || {},
      replacements
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}

