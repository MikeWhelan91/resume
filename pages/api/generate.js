import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";
import { withLimiter } from "../../lib/ratelimit";

export const config = { api: { bodyParser: false } };

function firstFile(f){ return Array.isArray(f) ? f[0] : f; }

async function extractTextFromFile(file){
  const f = firstFile(file); if (!f) return "";
  const p = f.filepath || f.path;
  const mime = (f.mimetype || f.type || "").toLowerCase();
  if (!p) return "";
  const buf = fs.readFileSync(p);
  if (mime.includes("pdf") || p.toLowerCase().endsWith(".pdf")){
    const r = await pdfParse(buf); return r.text || "";
  }
  if (mime.includes("wordprocessingml") || p.toLowerCase().endsWith(".docx")){
    const { value } = await mammoth.extractRawText({ buffer: buf }); return value || "";
  }
  return buf.toString("utf8");
}

function parseForm(req){
  const form = formidable({ multiples:true, uploadDir: os.tmpdir(), keepExtensions:true, maxFileSize: 20*1024*1024 });
  return new Promise((resolve,reject)=>form.parse(req,(err,fields,files)=>err?reject(err):resolve({fields,files})));
}

// ---- JSON helpers ----
function stripCodeFence(s=""){
  const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : s;
}
function safeJSON(s){ try{ return JSON.parse(stripCodeFence(s)); } catch { return null; } }

// ---- NEW: pass 1 — inventory skills strictly from résumé ----
async function extractAllowedSkills(client, resumeText){
  const sys = "Output ONLY JSON: {\"skills\": string[]} Extract skills mentioned IN THE RESUME TEXT ONLY. No guessing or synonyms. Ignore any job description.";
  const user = `RESUME_TEXT:\n${resumeText}`;
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role:"system", content: sys }, { role:"user", content: user }]
  });
  const inv = safeJSON(r.choices?.[0]?.message?.content || "") || {};
  const skills = Array.isArray(inv.skills) ? inv.skills.map(s=>String(s).trim()).filter(Boolean) : [];
  const uniq = Array.from(new Set(skills.map(s=>s.toLowerCase())));
  return uniq;
}

async function coreHandler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });

  try{
    const { fields, files } = await parseForm(req);
    const resumeText = await extractTextFromFile(files?.resume);
    const coverText  = await extractTextFromFile(files?.coverLetter);
    const jobDesc    = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : (fields?.jobDesc || "");

    if (!resumeText && !coverText) return res.status(400).json({ error:"No readable files", code:"E_NO_FILES" });
    if (!jobDesc || jobDesc.trim().length < 30) return res.status(400).json({ error:"Job description too short", code:"E_BAD_INPUT" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Pass 1: résumé-only allow-list
    const allowedSkills = await extractAllowedSkills(client, resumeText);
    const allowedSkillsCSV = allowedSkills.join(", ");

    // Pass 2: generate with hard constraints and transferables
    const system = `
You output ONLY JSON with keys:
- coverLetterText: string
- resumeData: object (name, title?, email?, phone?, location?, summary?, links[], skills[], experience[], education[])
- transferables: array of { requiredSkill: string, mappedFrom: string[], rationale: string }

STRICT RULES:
- Treat ALLOWED_SKILLS as an allow-list. resumeData.skills MUST be a subset of ALLOWED_SKILLS.
- Do NOT add tools/tech/frameworks in skills or experience if they are not in ALLOWED_SKILLS.
- If the job description requires skills NOT in ALLOWED_SKILLS, add entries to transferables with 1–2 resume skills that map logically and a short rationale.
- The coverLetterText MUST NOT claim direct experience with non-allowed skills. Use phrasing like "While I haven't used X directly, I have Y which maps to X by Z."
- Never fabricate employers, dates, credentials, or numbers. If unknown, omit. No prose outside JSON. No markdown fences.
ALLOWED_SKILLS: ${allowedSkillsCSV}
`.trim();

    const user = `
Generate JSON for a tailored cover letter and a revised resume (ATS-friendly).

Job Description:
${jobDesc}

Extracted Resume Text:
${resumeText}

Previous Cover Letter (optional):
${coverText}
`.trim();

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role:"system", content: system }, { role:"user", content: user }]
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json) return res.status(502).json({ error:"Bad model output", code:"E_BAD_MODEL_OUTPUT", raw });

    // Normalize + enforce subset in code
    const allowed = new Set(allowedSkills);
    const rd = normalizeResumeData(json.resumeData || {});
    rd.skills = (rd.skills || []).filter(s => allowed.has(String(s).toLowerCase()));

    const payload = {
      coverLetter: String(json.coverLetterText || ""),
      resumeData: rd,
      transferables: Array.isArray(json.transferables) ? json.transferables : []
    };

    return res.status(200).json(payload);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error:"Server error", detail:String(err?.message || err) });
  }
}

export default withLimiter(coreHandler, { limit: 10, windowMs: 60_000 });

