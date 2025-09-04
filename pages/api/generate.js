import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";

export const config = { api: { bodyParser: false } };

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
    const resumeText = await extractTextFromFile(files?.resume);
    const coverText  = await extractTextFromFile(files?.coverLetter);
    const jobDesc    = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : (fields?.jobDesc || "");

    if (!resumeText && !coverText) {
      return res.status(400).json({ error: "No readable files", code: "E_NO_FILES" });
    }
    if (!jobDesc || jobDesc.trim().length < 30) {
      return res.status(400).json({ error: "Job description too short", code: "E_BAD_INPUT" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const SYSTEM = `
You are a structured writer. Output ONLY strict JSON (no markdown, no fences).
Do everything in ONE pass.

PROCESS
1) From the RESUME text, extract verifiable facts: header fields (name/title/location/email/phone), employers/roles/dates, skills/tools/systems/software, certifications, degrees, and links. Call this set RESUME_TERMS (lowercased; include product/tool/system names and acronyms found in the résumé).
2) From the JOB DESCRIPTION, extract concrete named terms (tools/systems/software/products/certs/acronyms). Call this set JD_TERMS (lowercased).
3) Compute JD_ONLY = JD_TERMS − RESUME_TERMS.

RULES (MUST FOLLOW)
- Header fields (name/title/location/email/phone) MUST come ONLY from the résumé text; do NOT copy header values from the JD.
- NEVER use any item from JD_ONLY anywhere in the outputs (resumeData or coverLetter). If a sentence would require such an item, paraphrase generically without naming it, or omit that detail.
- Do not invent employers, dates, certifications, awards, or tools not present in the résumé.
- Keep tone professional and concise.

RETURN EXACTLY THIS JSON SHAPE:
{
  "resumeData": {
    "header": { "name": string?, "title": string?, "location": string?, "email": string?, "phone": string? },
    "summary": string?,
    "skills": [string],                        // use only items present in the résumé
    "experience": [
      { "company": string, "role": string?, "location": string?, "start": string?, "end": string?, "bullets": [string] }
    ],
    "education": [ { "line": string } ],
    "links": [ { "label": string, "url": string } ]
  },
  "coverLetter": string,                       // must NOT contain any JD_ONLY item
  "audit": {
    "resume_terms": [string],                  // what you extracted from the résumé
    "jd_terms": [string],                      // what you extracted from the JD
    "jd_only": [string],                       // jd_terms not in resume_terms
    "violations": [string]                     // any jd_only term that still appears in resumeData or coverLetter (should be [])
  }
}
`.trim();

    const user = `
Generate JSON for a tailored cover letter and a revised resume (ATS-friendly).
INPUTS
Job Description:
${jobDesc}

Extracted Resume Text:
${resumeText}

Previous Cover Letter (optional):
${coverText}
`.trim();

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }]
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json) {
      // Give the client *something* useful without crashing
      return res.status(502).json({ error: "Bad model output", code: "E_BAD_MODEL_OUTPUT", raw });
    }

    const resumeData = normalizeResumeData(json.resumeData || {});
    const coverLetter = String(json.coverLetterText || "");

    return res.status(200).json({ coverLetter, resumeData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}

