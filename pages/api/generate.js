import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import crypto from "crypto";

import { normalizeResumeData } from "../../lib/normalizeResume";
import { enforceHeaderFromResume } from "../../lib/headerGuard";
import { prefilterResume } from "../../lib/textPrefilter";
import { cacheGet, cacheSet } from "../../lib/cache";
import { makeBlocklist, scrubSentences, scrubBullets } from "../../lib/facts";

export const config = { api: { bodyParser: false } };

function firstFile(f) { return Array.isArray(f) ? f[0] : f; }
async function extractTextFromFile(file) {
  const f = firstFile(file); if (!f) return "";
  const p = f.filepath || f.path;
  const mime = (f.mimetype || f.type || "").toLowerCase();
  if (!p) return "";
  const buf = fs.readFileSync(p);
  if (mime.includes("pdf") || p.toLowerCase().endsWith(".pdf")) { const r = await pdfParse(buf); return r.text || ""; }
  if (mime.includes("wordprocessingml") || p.toLowerCase().endsWith(".docx")) { const { value } = await mammoth.extractRawText({ buffer: buf }); return value || ""; }
  return buf.toString("utf8");
}
function parseForm(req) {
  const form = formidable({ multiples:true, uploadDir: os.tmpdir(), keepExtensions:true, maxFileSize: 20*1024*1024 });
  return new Promise((resolve, reject) => form.parse(req,(err,fields,files)=>err?reject(err):resolve({fields,files})));
}
function stripFence(s=""){ const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return m ? m[1] : s; }
function safeJSON(s){ try { return JSON.parse(stripFence(s)); } catch { return null; } }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  try {
    const { fields, files } = await parseForm(req);
    const resumeTextFull = await extractTextFromFile(files?.resume);
    const jobDesc = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : (fields?.jobDesc || "");

    if (!resumeTextFull) return res.status(400).json({ error: "No readable resume file", code: "E_NO_RESUME" });
    if (!jobDesc || jobDesc.trim().length < 30) return res.status(400).json({ error: "Job description too short", code: "E_BAD_INPUT" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ==== FREE honesty guard: heuristic extract + cache ====
    const resumePref = prefilterResume(resumeTextFull);
    const hash = crypto.createHash("sha256").update(resumePref).digest("hex");
    let allowBlock = cacheGet(hash);
    if (!allowBlock) {
      allowBlock = makeBlocklist(resumePref, jobDesc); // { allow, block }
      cacheSet(hash, allowBlock, 6 * 60 * 60 * 1000); // 6h
    }
    const { allow, block } = allowBlock;
    const allowedList = [...allow].sort().join(", ");

    // ==== Main (single) LLM call for outputs ====
    const system = `You output ONLY JSON with keys: coverLetterText (string) and resumeData (object).
RULES (STRICT):
- Header fields (name, title, location, email, phone) MUST come ONLY from the uploaded resume text.
- Do NOT copy or infer header fields from the job description. If a header field is not present in the resume, omit it.
- You may tailor summary and bullets to the job description, but never invent employers, dates, certifications, or tools not present in the resume.
- Prefer skills/tools from this allow-list derived from the resume: ${allowedList}
No prose outside JSON.`;

    const user = `Generate a tailored cover letter and a revised resume (ATS-friendly).

JOB DESCRIPTION:
${jobDesc}

EXTRACTED RESUME TEXT:
${resumePref}`;

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      // response_format: { type: "json_object" }, // if available
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json) return res.status(502).json({ error: "Bad model output", code: "E_BAD_MODEL_OUTPUT" });

    // ==== Scrub JD-only claims (FREE, deterministic) ====
    const coverRaw = String(json.coverLetterText || "");
    const resumeRaw = json.resumeData || {};

    // use allow + block to avoid nuking mixed sentences/bullets
    const coverLetter = scrubSentences(coverRaw, block, allow);
    if (Array.isArray(resumeRaw.experience)) {
      resumeRaw.experience = resumeRaw.experience.map(x => ({
        ...x,
        bullets: scrubBullets(x?.bullets || [], block, allow)
      }));
    }

    // ==== Normalize + header guard ====
    const resumeDataNormalized = normalizeResumeData(resumeRaw);
    const resumeData = enforceHeaderFromResume(resumeDataNormalized, resumeTextFull);

    return res.status(200).json({ coverLetter, resumeData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
