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

    const system = `You output ONLY JSON with keys: coverLetterText (string) and resumeData (object).
resumeData should contain fields like:
- name, title?, email?, phone?, location?, summary?
- links: array (items may be {label,url} or strings)
- skills: array of strings
- experience: array of { company, role, start, end|null, bullets[], location? }
- education: array of { school, degree, start, end }
Use the job description only to prioritize what existing resume content to highlight.
Do NOT introduce skills, titles, or locations that are absent from the extracted resume text.
The cover letter must also avoid mentioning skills not found in the resume.
Never fabricate employers, dates, credentials, or numbers. If unsure, omit. No prose, no markdown fences.`;

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

    const resumeData = normalizeResumeData(json.resumeData || {});
    const coverLetter = String(json.coverLetterText || "");

    // Ensure we don't introduce skills or header details not present in the original resume
    const resumeLC = resumeText.toLowerCase();
    const inResume = (v) => v && resumeLC.includes(String(v).toLowerCase());

    resumeData.skills = Array.isArray(resumeData.skills)
      ? resumeData.skills.filter((s) => inResume(s))
      : [];

    if (resumeData.title && !inResume(resumeData.title)) delete resumeData.title;
    if (resumeData.location && !inResume(resumeData.location)) delete resumeData.location;

    return res.status(200).json({ coverLetter, resumeData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}

