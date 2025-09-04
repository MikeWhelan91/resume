import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";
import { extractAllowed, findViolations, sanitizeOutput } from "../../lib/facts";

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

    const allowed = extractAllowed(resumeText); // Set<string>
    const allowedList = Array.from(allowed).sort().join(", ");

    if (!resumeText && !coverText) {
      return res.status(400).json({ error: "No readable files", code: "E_NO_FILES" });
    }
    if (!jobDesc || jobDesc.trim().length < 30) {
      return res.status(400).json({ error: "Job description too short", code: "E_BAD_INPUT" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You output ONLY JSON with keys: coverLetterText (string) and resumeData (object).
RULES:
- You may assert ONLY skills/tools/technologies present in ALLOWED_SKILLS.
- If the job description mentions skills not in ALLOWED_SKILLS, you may acknowledge interest or willingness to learn, but NEVER claim prior use.
- Do NOT invent employers, dates, or certifications.
Return also a field "violations": string[] listing any tokens you attempted to use that were outside ALLOWED_SKILLS.
ALLOWED_SKILLS: ${allowedList}
resumeData format (loose): { name?, title?, email?, phone?, location?, links?, summary?, skills: string[], experience: [{ company?, role?, start?, end?, bullets: string[], location? }], education?: [...] }
No prose outside JSON.`;

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

    const coverRaw = String(json.coverLetterText || "");
    const resumeRaw = json.resumeData || {};
    const combinedOut = coverRaw + "\n" + JSON.stringify(resumeRaw);

    const sanitizedCover = sanitizeOutput(coverRaw, allowed, jobDesc);
    if (Array.isArray(resumeRaw.experience)) {
      resumeRaw.experience = resumeRaw.experience.map(x => ({
        ...x,
        bullets: Array.isArray(x.bullets) ? sanitizeOutput(x.bullets.join("\n"), allowed, jobDesc).split("\n").filter(Boolean) : []
      }));
    }

    const resumeData = normalizeResumeData(resumeRaw);
    const violations = findViolations(combinedOut, allowed, jobDesc);

    return res.status(200).json({ coverLetter: sanitizedCover, resumeData, violations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}

