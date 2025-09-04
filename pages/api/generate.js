// pages/api/generate.js
import os from "os";
import path from "path";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: false },
};

// ---- helpers ----
function firstFile(f) {
  if (!f) return undefined;
  return Array.isArray(f) ? f[0] : f;
}

async function extractTextFromFile(file) {
  const f = firstFile(file);
  if (!f) return "";

  const filePath = f.filepath || f.path; // support both props
  const mime = (f.mimetype || f.type || "").toLowerCase();
  if (!filePath) {
    console.warn("[extractTextFromFile] missing filePath", f);
    return "";
  }

  const buffer = fs.readFileSync(filePath);

  // PDF
  if (mime.includes("application/pdf") || filePath.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  // DOCX
  if (
    mime.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    filePath.toLowerCase().endsWith(".docx")
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value || "";
  }

  // TXT or unknown → try utf8
  return buffer.toString("utf8");
}

async function parseForm(req) {
  const form = formidable({
    multiples: true,
    uploadDir: os.tmpdir(),       // ensure files are written
    keepExtensions: true,         // preserve .pdf/.docx
    maxFileSize: 20 * 1024 * 1024 // 20MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

// ---- handler ----
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  try {
    const { fields, files } = await parseForm(req);

    // DEBUG: log what we actually got
    console.log("[files keys]", Object.keys(files || {}));
    console.log("[resume]", firstFile(files?.resume));
    console.log("[coverLetter]", firstFile(files?.coverLetter));

    const resumeText = await extractTextFromFile(files?.resume);
    const coverText  = await extractTextFromFile(files?.coverLetter);
    const jobDescRaw = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : fields?.jobDesc || "";

    if (!resumeText && !coverText) {
      return res.status(400).json({ error: "No readable files received (PDF/DOCX/TXT)." });
    }
    if (!jobDescRaw.trim()) {
      return res.status(400).json({ error: "Job description is required." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are a hiring-savvy writing assistant.

INPUTS
- Job Description (plain text)
- Resume (plain text extracted)
- Optional previous Cover Letter

TASKS
1) Write a concise, professional COVER LETTER tailored to the job based on the uploaded documentation from the user.
2) Produce a revised RESUME (text only), rewording bullets to emphasize relevant skills/keywords, preserving chronology and ATS-friendliness.

STRICT RULES
- Do NOT use placeholders like [Company Name] or [Hiring Manager]. Infer names from the job description; if unknown, use “Dear Hiring Manager” and the company as “the company”.
- Keep cover letter to 220–300 words unless role clearly warrants more.
- DO NOT lie in the cover letter, if a user does not have experience based on something in the job description - you should stretch what the user input to compensate
- For the CV, do not change any experience or education, you may highlight some parts more than they are currently. 
- Keep resume content scannable: short bullet points, strong verbs, quantified impact where possible.
- BE HONEST, if a user does not have the required skills for the job you can say how the user's experience could show how they would slot into this new role.
- Focus more on work experience over interests/skills. You can still mention these interests/skills but experience is essential
FORMAT EXACTLY:
===COVER_LETTER===
<cover letter text>

===RESUME===
<resume text>

--- INPUTS ---
Job Description:
${jobDescRaw}

Resume:
${resumeText}

Previous Cover Letter (optional):
${coverText}
`.trim();


   const completion = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.4,
});

// Full model output
const full = completion.choices?.[0]?.message?.content || "";

// Optional: inspect raw output during testing
// console.log("[MODEL OUTPUT]\n", full);

let coverLetter = "";
let resume = "";

// Prefer strict markers we asked the model to use
const coverIdx = full.indexOf("===COVER_LETTER===");
const resumeIdx = full.indexOf("===RESUME===");

if (resumeIdx !== -1) {
  coverLetter = full
    .slice(0, resumeIdx)
    .replace("===COVER_LETTER===", "")
    .trim();
  resume = full.slice(resumeIdx + "===RESUME===".length).trim();
} else {
  // Fallback: split on a heading-like "Resume:" if markers are missing
  const parts = full.split(/(?:^|\n)Resume\s*:/i);
  coverLetter = parts[0].replace(/^\s*Cover\s*Letter\s*:\s*/i, "").trim();
  resume = (parts[1] || "").trim();
}

return res.status(200).json({ coverLetter, resume });

    return res.status(200).json({ coverLetter, resume });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
