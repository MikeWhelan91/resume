import os from "os";
import path from "path";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { ResumeData } from "../../lib/resumeSchema";

export const config = { api: { bodyParser: false } };

function firstFile(f){ if(!f) return; return Array.isArray(f)?f[0]:f; }

async function extractTextFromFile(file){
  const f = firstFile(file); if(!f) return "";
  const p = f.filepath || f.path; const mime = (f.mimetype || f.type || "").toLowerCase();
  if(!p) return ""; const buf = fs.readFileSync(p);
  if (mime.includes("pdf") || p.toLowerCase().endsWith(".pdf")) { const r = await pdfParse(buf); return r.text || ""; }
  if (mime.includes("wordprocessingml") || p.toLowerCase().endsWith(".docx")) { const { value } = await mammoth.extractRawText({ buffer: buf }); return value || ""; }
  return buf.toString("utf8");
}

async function parseForm(req){
  const form = formidable({ multiples:true, uploadDir: os.tmpdir(), keepExtensions:true, maxFileSize: 20*1024*1024 });
  return new Promise((resolve,reject)=>form.parse(req,(err,fields,files)=>err?reject(err):resolve({fields,files})));
}

function safeJSON(s){
  try { return JSON.parse(s); } catch { return null; }
}

export default async function handler(req,res){
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  try{
    const { fields, files } = await parseForm(req);
    const resumeText = await extractTextFromFile(files?.resume);
    const coverText  = await extractTextFromFile(files?.coverLetter);
    const jobDesc    = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : fields?.jobDesc || "";
    if (!resumeText && !coverText) return res.status(400).json({ error: "No readable files", code:"E_NO_FILES" });
    if (!jobDesc || jobDesc.trim().length < 30) return res.status(400).json({ error: "Job description too short", code:"E_BAD_INPUT" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You output ONLY JSON with keys: coverLetterText (string) and resumeData (object).
resumeData must match the schema:
{ "name": string, "title?": string, "email": string, "phone?": string, "location?": string,
  "links": [{ "label": string, "url": string }] (optional),
  "summary?": string, "skills": [string],
  "experience": [{ "company": string, "role": string, "start": "YYYY-MM", "end": "YYYY-MM" | null, "bullets": [string], "location?": string }],
  "education": [{ "school": string, "degree": string, "start": "YYYY-MM", "end": "YYYY-MM" }]
}
Never fabricate employers, dates, credentials, or numbers. If unknown, omit field.`;

    const user = `
Generate JSON for a tailored cover letter and a revised resume.
- Keep ATS-friendly writing: concise bullets with strong verbs, no tables/icons.
- If skills are missing, leverage adjacent experience honestly.
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
      messages: [{ role:"system", content: system }, { role:"user", content: user }]
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json || typeof json.coverLetterText !== "string" || typeof json.resumeData !== "object") {
      return res.status(502).json({ error: "Bad model output", code: "E_BAD_MODEL_OUTPUT", raw });
    }

    // Validate resumeData against schema; if invalid, return error
    const parsed = ResumeData.safeParse(json.resumeData);
    if (!parsed.success) {
      return res.status(502).json({ error: "Invalid resume shape", code: "E_SCHEMA", details: parsed.error.flatten() });
    }

    return res.status(200).json({ coverLetter: json.coverLetterText, resumeData: parsed.data });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
