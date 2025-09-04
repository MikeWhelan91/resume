import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";
import { enforceHeaderFromResume } from "../../lib/headerGuard";

export const config = { api: { bodyParser: false } };

function normalizeNewlines(s = "") {
  // If the model double-escaped, convert literal "\n" into real newlines.
  return String(s).replace(/\\r?\\n/g, "\n");
}

// Generic, domain-agnostic "named term" finder
function extractNamedTerms(text = "") {
  const t = String(text);
  const set = new Set();

  // TitleCase phrases (1–3 words): "City & Guilds", "Adobe XD", "Google Cloud"
  (t.match(/\b([A-Z][A-Za-z0-9.+#-]{2,}(?:\s+[A-Z][A-Za-z0-9.+#-]{2,}){0,2})\b/g) || [])
    .forEach(s => set.add(s.trim()));

  // ALL-CAPS acronyms (2–6 chars): OSHA, HIPAA, CNC, AWS, CPA
  (t.match(/\b[A-Z]{2,6}\b/g) || []).forEach(s => set.add(s.trim()));

  // Single tokens that look like named items (contain . + # - OR are TitleCase)
  (t.match(/\b[A-Za-z][A-Za-z0-9.+#-]{1,}\b/g) || []).forEach(tok => {
    if (/[.+#-]/.test(tok) || /^[A-Z][A-Za-z0-9.+#-]{2,}$/.test(tok)) set.add(tok.trim());
  });

  return Array.from(set);
}

// Replace JD-only named terms in the COVER LETTER ONLY with a neutral phrase.
// No lists, no product names—works across professions.
function neutralizeJDOnly({ coverLetter, resumeText, jobDesc, replacement = "a relevant tool" }) {
  let out = String(coverLetter || "");
  if (!out) return out;

  const jdTerms = extractNamedTerms(jobDesc);
  if (!jdTerms.length) return out;

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const resumeBody = " " + String(resumeText).toLowerCase() + " ";

  for (const term of jdTerms) {
    // Allow it if the exact term appears in the résumé text
    const needle = " " + term.toLowerCase() + " ";
    if (resumeBody.includes(needle)) continue;

    // Otherwise neutralize
    const re = new RegExp(`\\b${esc(term)}\\b`, "gi");
    out = out.replace(re, replacement);

    // Tidy "such as <term>" / "like <term>"
    out = out.replace(new RegExp(`\\b(such as|like)\\s+${esc(term)}\\b`, "gi"), "");
  }

  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

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
  const form = formidable({
    multiples: true, uploadDir: os.tmpdir(),
    keepExtensions: true, maxFileSize: 20 * 1024 * 1024
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
  });
}

// JSON helpers
function stripCodeFence(s = "") {
  const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : s;
}
function safeJSON(s) {
  try { return JSON.parse(stripCodeFence(s)); } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  try {
    const { fields, files } = await parseForm(req);
    const resumeTextFull = await extractTextFromFile(files?.resume);
    const coverText  = await extractTextFromFile(files?.coverLetter);
    const jobDesc    = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : (fields?.jobDesc || "");

    if (!resumeTextFull && !coverText) {
      return res.status(400).json({ error: "No readable files", code: "E_NO_FILES" });
    }
    if (!jobDesc || jobDesc.trim().length < 30) {
      return res.status(400).json({ error: "Job description too short", code: "E_BAD_INPUT" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You output ONLY JSON with keys: coverLetterText (string) and resumeData (object).
resumeData should contain fields like:
- name, title?, email?, phone?, location?, summary?
- links: array (items may be {label,url} or strings)
- skills: array of strings
- experience: array of { company, role, start, end|null, bullets[], location? }
- education: array of { school, degree, start, end }
Do NOT use the job description to set résumé header fields. Header fields must come only from the uploaded résumé text.
Do NOT mention specific tools/systems/certifications that are not present in the résumé; if mentioned in the JD, use a generic phrase.
Never fabricate employers, dates, credentials, or numbers. If unknown, omit. No prose, no markdown fences.`;

    const user = `
Generate JSON for a tailored cover letter and a revised resume (ATS-friendly).
INPUTS
Job Description:
${jobDesc}

Extracted Resume Text:
${resumeTextFull}

Previous Cover Letter (optional):
${coverText}
`.trim();

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      // If supported on your account, uncomment for stricter JSON:
      // response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json) {
      // Give the client *something* useful without crashing
      return res.status(502).json({ error: "Bad model output", code: "E_BAD_MODEL_OUTPUT", raw });
    }

    // Cover letter: normalize newlines and neutralize JD-only named terms
    const coverRaw = String(json.coverLetter || json.coverLetterText || "");
    let coverLetter = normalizeNewlines(coverRaw);
    coverLetter = neutralizeJDOnly({ coverLetter, resumeText: resumeTextFull, jobDesc });

    // Resume: normalize then lock header fields to résumé text only
    let resumeDataNormalized = normalizeResumeData(json.resumeData || {});
    const lockedHeader = enforceHeaderFromResume(
      {
        name: resumeDataNormalized.name,
        title: resumeDataNormalized.title,
        location: resumeDataNormalized.location,
        email: resumeDataNormalized.email,
        phone: resumeDataNormalized.phone,
      },
      resumeTextFull
    );
    Object.assign(resumeDataNormalized, lockedHeader);

    return res.status(200).json({
      resumeData: resumeDataNormalized,
      coverLetter,
      audit: json.audit || {},
      replacements: json.replacements || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}

