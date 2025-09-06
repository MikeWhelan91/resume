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
  let text = "";
  if (mime.includes("pdf") || p.toLowerCase().endsWith(".pdf")){
    const r = await pdfParse(buf); text = r.text || "";
  } else if (mime.includes("wordprocessingml") || p.toLowerCase().endsWith(".docx")){
    const { value } = await mammoth.extractRawText({ buffer: buf }); text = value || "";
  } else {
    text = buf.toString("utf8");
  }
  try{ fs.unlinkSync(p); }catch{}
  return text;
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
    const resumeDataField = Array.isArray(fields?.resumeData) ? fields.resumeData[0] : fields?.resumeData;
    let resumeData = null;
    if (resumeDataField) {
      resumeData = normalizeResumeData(safeJSON(resumeDataField) || {});
    }
    const resumeText = resumeData ? "" : await extractTextFromFile(files?.resume);
    const coverText  = await extractTextFromFile(files?.coverLetter);
    const jobDesc    = Array.isArray(fields?.jobDesc) ? fields.jobDesc[0] : (fields?.jobDesc || "");
    const tone       = Array.isArray(fields?.tone) ? fields.tone[0] : (fields?.tone || "professional");

    if (!resumeData && !resumeText) return res.status(400).json({ error:"No readable resume", code:"E_NO_RESUME" });
    if (!jobDesc || jobDesc.trim().length < 30) return res.status(400).json({ error:"Job description too short", code:"E_BAD_INPUT" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Pass 1: résumé-only allow-list
    const allowedSkills = resumeData
      ? (resumeData.skills || []).map(s=>String(s).toLowerCase())
      : await extractAllowedSkills(client, resumeText);
    const allowedSkillsCSV = allowedSkills.join(", ");

    // Pass 2: generate with hard constraints
    const system = `
You output ONLY JSON with keys:
- coverLetterText: string
- resumeData: object (name, title?, email?, phone?, location?, summary?, links[], skills[], experience[], education[])

STRICT RULES:
- Treat ALLOWED_SKILLS as an allow-list. resumeData.skills MUST be a subset of ALLOWED_SKILLS.
- Do NOT add tools/tech/frameworks in skills or experience if they are not in ALLOWED_SKILLS.
- For resumeData.experience[], each item must include company, role, start, end, location?, bullets[]. Start/end dates must come from the candidate's resume and must not be fabricated. Bullets should be concise accomplishment statements reworded to align with the job description.
- For resumeData.education[], each item must include school, degree, start, end, grade? Dates and grade must come from the candidate's resume and must not be fabricated.
- The coverLetterText MUST NOT claim direct experience with non-allowed skills. Use phrasing like "While I haven't used X directly, I have Y which maps to X by Z."
- The coverLetterText must adopt a ${tone} tone.
- The resume must be ATS-optimized: use plain formatting, concise bullet points beginning with strong action verbs, and integrate relevant keywords from the job description where applicable. Avoid tables or images.
- Never fabricate employers, dates, credentials, or numbers. If unknown, omit. No prose outside JSON. No markdown fences.
ALLOWED_SKILLS: ${allowedSkillsCSV}
`.trim();

    const resumePayload = resumeData ? JSON.stringify(resumeData) : resumeText;
    const user = `
Generate JSON for a tailored cover letter and a revised resume (ATS-friendly).

Cover Letter Tone:
${tone}

Job Description:
${jobDesc}

Resume Data:
${resumePayload}

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
      resumeData: rd
    };

    return res.status(200).json(payload);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error:"Server error", detail:String(err?.message || err) });
  }
}

export default withLimiter(coreHandler, { limit: 10, windowMs: 60_000 });

