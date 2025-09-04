import os from "os";
import path from "path";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { z } from "zod";
import { GenFields } from "../../lib/schema";
import { withLimiter } from "../../lib/ratelimit";

export const config = { api: { bodyParser: false } };

// ---- helpers ----
function firstFile(f) {
  if (!f) return undefined;
  return Array.isArray(f) ? f[0] : f;
}

async function extractTextFromFile(file) {
  const f = firstFile(file);
  if (!f) return "";

  const filePath = f.filepath || f.path;
  const mime = (f.mimetype || f.type || "").toLowerCase();
  if (!filePath) return "";

  const buffer = fs.readFileSync(filePath);

  if (mime.includes("application/pdf") || filePath.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  if (
    mime.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    filePath.toLowerCase().endsWith(".docx")
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value || "";
  }

  return buffer.toString("utf8");
}

async function parseForm(req) {
  const form = formidable({
    multiples: true,
    uploadDir: os.tmpdir(),
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

function splitSections(full) {
  const coverTag = "===COVER_LETTER===";
  const resumeTag = "===RESUME===";
  const coverIdx = full.indexOf(coverTag);
  const resumeIdx = full.indexOf(resumeTag);
  if (coverIdx === -1 || resumeIdx === -1) return null;
  const coverLetter = full.slice(coverIdx + coverTag.length, resumeIdx).trim();
  const resume = full.slice(resumeIdx + resumeTag.length).trim();
  if (!coverLetter || !resume) return null;
  return { coverLetter, resume };
}

async function callModel(client, prompt, temperature = 0.4) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature,
  });
  return completion.choices?.[0]?.message?.content || "";
}

// ---- handler ----
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY", code: "E_NO_KEY" });

  try {
    const { fields, files } = await parseForm(req);

    const resumeText = await extractTextFromFile(files?.resume);
    const coverText = await extractTextFromFile(files?.coverLetter);
    const jobDescRaw = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : fields?.jobDesc || "";
    const mode = Array.isArray(fields?.mode) ? fields.mode[0] : fields?.mode || "default";
    const tighten = Array.isArray(fields?.tighten) ? fields.tighten[0] : fields?.tighten ?? 0;

    if (!resumeText && !coverText) {
      return res.status(400).json({ error: "No readable files received (PDF/DOCX/TXT).", code: "E_NO_FILES" });
    }

    // Validate fields
    const parsed = GenFields.safeParse({ jobDesc: jobDescRaw, mode, tighten });
    if (!parsed.success) {
      return res.status(400).json({ error: "Bad input", code: "E_BAD_INPUT", details: parsed.error.flatten() });
    }
    const { jobDesc } = parsed.data;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Tighten guidance
    const tightenCopy =
      parsed.data.tighten === 0 ? "Keep default length." :
      parsed.data.tighten === 1 ? "Reduce verbosity by ~15% while preserving key skills." :
      "Reduce verbosity by ~25% while preserving key skills.";

    // ATS mode guidance
    const atsCopy = parsed.data.mode === "ats"
      ? "Use ATS-friendly formatting: single column, no tables or icons, simple headings, concise bullets."
      : "Use clean professional formatting.";

    const prompt = `
You are a hiring-savvy writing assistant.

INPUTS
- Job Description (plain text)
- Resume (plain text extracted)
- Optional previous Cover Letter

TASKS
1) Write a concise, professional COVER LETTER tailored to the job based on the uploaded documentation.
2) Produce a revised RESUME (text only), rewording bullets to emphasize relevant skills/keywords, preserving chronology and ATS-friendliness.

GUARDRAILS
- Never fabricate employers, dates, credentials, or numbers.
- If skills are missing, leverage adjacent experience honestly.
- ${atsCopy}
- ${tightenCopy}

MARKERS (output MUST include the exact tags below):
===COVER_LETTER===

===RESUME===

--- INPUTS ---
Job Description:
${jobDesc}

Resume:
${resumeText}

Previous Cover Letter (optional):
${coverText}
`.trim();

    // First attempt
    let full = await callModel(client, prompt, 0.3);
    let out = splitSections(full);

    // Retry once with stricter instruction
    if (!out) {
      const strict = `
Return ONLY the two sections below with exact markers and no extra text.
===COVER_LETTER===

===RESUME===

${prompt}`;
      full = await callModel(client, strict, 0.2);
      out = splitSections(full);
    }

    if (!out) {
      return res.status(502).json({ error: "Bad model output", code: "E_BAD_MODEL_OUTPUT" });
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", code: "E_SERVER", detail: String(err?.message || err) });
  }
}

export default withLimiter(handler, { limit: 10, windowMs: 60_000 });
