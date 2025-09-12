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

// ---- NEW: inventory skills from job description ----
async function extractJobSkills(client, jobDesc){
  const sys = "Output ONLY JSON: {\\\"skills\\\": string[]} Extract skills explicitly mentioned IN THE JOB DESCRIPTION ONLY. No guessing or synonyms.";
  const user = `JOB_DESCRIPTION:\n${jobDesc}`;
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

// ---- NEW: dynamically expand skills with synonyms ----
async function expandSkills(client, skills){
  if(!skills || skills.length === 0) return [];
  const sys = "Output ONLY JSON: {\\\"synonyms\\\": {<skill>: string[]}} For each SKILL in SKILLS, list up to three common keyword variants or synonyms that might appear in job postings.";
  const user = `SKILLS:${JSON.stringify(skills)}`;
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role:"system", content: sys }, { role:"user", content: user }]
  });
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  const map = out?.synonyms && typeof out.synonyms === 'object' ? out.synonyms : {};
  const expanded = new Set(skills.map(s=>String(s).toLowerCase()));
  for(const k of Object.keys(map)){
    const list = Array.isArray(map[k]) ? map[k] : [];
    list.forEach(x => expanded.add(String(x).toLowerCase()));
  }
  return Array.from(expanded);
}

// ---- NEW: post-process bullets with modern resume best practices ----
async function rewriteBullets(client, jobDesc, resumeContext, bullets){
  if(!bullets || bullets.length === 0) return bullets;
  
  const sys = `Output ONLY JSON: {"bullets": string[]} 

Transform BULLETS into recruiter-optimized achievement statements using modern resume best practices:

FORMULA: [Action Verb] + [What You Did] + [Quantifiable Result/Impact] + [Context if needed]

BEST PRACTICES:
1. START WITH POWER VERBS: Achieved, Led, Transformed, Optimized, Delivered, Increased, Reduced, Implemented, Streamlined, Spearheaded, Generated, Exceeded, Improved, Architected, Collaborated

2. QUANTIFY EVERYTHING POSSIBLE:
   - Numbers: "Managed team of 8", "Processed 500+ applications daily"
   - Percentages: "Increased efficiency by 25%", "Reduced costs by 15%"
   - Time: "Delivered projects 2 weeks ahead of schedule"
   - Scale: "Across 15 departments", "Serving 10K+ users"

3. FOCUS ON BUSINESS IMPACT:
   - Revenue generation/cost savings
   - Process improvements 
   - Problem-solving outcomes
   - Team/project leadership results

4. AVOID WEAK LANGUAGE:
   - Remove: "Responsible for", "Duties included", "Worked on"
   - Replace with specific actions and outcomes

5. STRUCTURE: 15-25 words max, prioritize most impressive metrics first

6. KEYWORDS: Naturally integrate relevant JOB_DESC terms when supported by RESUME_CONTEXT

🚨 CRITICAL RULES - NO EXCEPTIONS:
- NEVER invent numbers, percentages, or metrics not in RESUME_CONTEXT
- NEVER add achievements, projects, or outcomes not mentioned in original resume
- ONLY improve wording and structure of existing content
- If no metrics exist, focus on scope, complexity, or methodology - DON'T CREATE THEM
- When in doubt, use the original bullet point
- Make every word count - eliminate filler
- Use parallel structure across bullets`;

  const user = `JOB_DESCRIPTION:\n${jobDesc}\n\nRESUME_CONTEXT:\n${resumeContext}\n\nBULLETS TO OPTIMIZE:\n${JSON.stringify(bullets)}`;
  
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [{ role:"system", content: sys }, { role:"user", content: user }]
  });
  
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  const arr = Array.isArray(out?.bullets) ? out.bullets.map(b=>String(b).trim()).filter(Boolean) : null;
  return arr && arr.length === bullets.length ? arr : bullets;
}

// ---- NEW: verify rewritten bullets against resume ----
async function verifyBullets(client, resumeContext, original, rewritten){
  if(!rewritten || rewritten.length === 0) return rewritten;
  const sys = "Output ONLY JSON: {\\\"valid\\\": boolean[]} For each bullet in NEW_BULLETS, return true if it is fully supported by RESUME_CONTEXT or ORIGINAL_BULLETS. Return false otherwise.";
  const user = `RESUME_CONTEXT:\n${resumeContext}\nORIGINAL_BULLETS:${JSON.stringify(original)}\nNEW_BULLETS:${JSON.stringify(rewritten)}`;
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role:"system", content: sys }, { role:"user", content: user }]
  });
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  const flags = Array.isArray(out?.valid) ? out.valid : [];
  return rewritten.map((b,i)=> flags[i] ? b : original[i]);
}

// ---- NEW: optimize professional summary ----
async function optimizeSummary(client, resumeContext, jobDesc, currentSummary){
  const sys = `Output ONLY JSON: {"summary": "string"} 

Create a compelling professional summary using modern resume best practices:

STRUCTURE (2-3 sentences, 50-80 words):
1. Professional title + years of experience + core specialization
2. Key achievements with quantifiable results (if available in resume)
3. Value proposition aligned with target role

BEST PRACTICES:
- Start with strongest professional identity (e.g., "Senior Software Engineer with 5+ years...")
- Use power words (achieved, led, transformed, optimized, delivered)
- Include specific metrics when available in resume (revenue, percentages, scale)
- Mention 2-3 most relevant technical skills or competencies
- Focus on business impact and value delivered
- Avoid generic phrases like "results-driven" or "team player"
- Write in third person, no "I" statements
- End with forward-looking value proposition

TONE: Confident, specific, achievement-focused`;

  const user = `JOB_DESCRIPTION:\n${jobDesc}\n\nRESUME_CONTEXT:\n${resumeContext}\n\nCURRENT_SUMMARY:\n${currentSummary || "No existing summary"}`;
  
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [{ role:"system", content: sys }, { role:"user", content: user }]
  });
  
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  return out?.summary || currentSummary;
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
    const userGoal   = Array.isArray(fields?.userGoal) ? fields.userGoal[0] : (fields?.userGoal || "both");

    if (!resumeData && !resumeText) return res.status(400).json({ error:"No readable resume", code:"E_NO_RESUME" });
    if (!jobDesc || jobDesc.trim().length < 30) return res.status(400).json({ error:"Job description too short", code:"E_BAD_INPUT" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Pass 1: résumé-only allow-list
    const allowedSkillsBase = resumeData
      ? (resumeData.skills || []).map(s=>String(s).toLowerCase())
      : await extractAllowedSkills(client, resumeText);
    const allowedSkills = await expandSkills(client, allowedSkillsBase);
    const expanded = new Set(allowedSkills);
    const allowedSkillsCSV = allowedSkills.join(", ");

    // Pass 2: derive job-only skills
    const jobSkills = await extractJobSkills(client, jobDesc);
    const jobOnlySkills = jobSkills.filter(s => !expanded.has(s));
    const jobOnlySkillsCSV = jobOnlySkills.join(", ");

    // Pass 3: generate with hard constraints
    const coverLetterNeeded = userGoal === 'cover-letter' || userGoal === 'both';
    const resumeNeeded = userGoal === 'cv' || userGoal === 'both';
    
    const outputKeys = [];
    if (coverLetterNeeded) outputKeys.push('- coverLetterText: string');
    if (resumeNeeded) outputKeys.push('- resumeData: object (name, title?, email?, phone?, location?, summary?, links[], skills[], experience[], education[])');
    
    const system = `
You are a professional resume writer and career consultant. Output ONLY JSON with keys:
${outputKeys.join('\n')}

🎯 PRIMARY GOAL: Transform this resume using modern best practices to maximize recruiter appeal and ATS compatibility.

${resumeNeeded ? `
📋 RESUME OPTIMIZATION RULES:

STRUCTURE & FORMATTING:
- Clean, ATS-friendly layout with clear section headers
- Consistent formatting and parallel structure throughout
- Strategic use of industry keywords naturally integrated

PROFESSIONAL SUMMARY:
- 2-3 compelling sentences (50-80 words) that immediately showcase value
- Lead with professional title + years of experience + core expertise
- Include quantifiable achievements when available
- End with forward-looking value proposition

SKILLS SECTION:
- Prioritize most relevant and in-demand skills first
- Only include skills from ALLOWED_SKILLS list
- Group related technologies logically
- Use full names for clarity (e.g., "JavaScript" not "JS")

EXPERIENCE OPTIMIZATION:
- Company, title, dates, location for each role
- 3-5 achievement-focused bullets per role (not duties)
- Formula: [Strong Action Verb] + [Specific Action] + [Quantifiable Result] + [Context]
- Lead with most impressive metrics and outcomes
- Use power verbs: Achieved, Led, Transformed, Delivered, Optimized, Increased, Reduced, etc.
- Focus on business impact: revenue, efficiency, cost savings, process improvements
- Eliminate weak phrases: "Responsible for", "Duties included", "Worked on"
- Keep bullets 15-25 words, prioritize concrete results over tasks

EDUCATION SECTION:
- Include degree, institution, graduation year, relevant GPA (3.5+)
- Add relevant coursework, projects, or honors if recent graduate
- Only verified information from original resume

ATS OPTIMIZATION:
- Use standard section headers (Experience, Education, Skills)
- Include relevant keywords from job description naturally
- Avoid graphics, tables, or unusual formatting
- Use common fonts and clear hierarchy
` : ''}

${coverLetterNeeded ? `
📝 COVER LETTER OPTIMIZATION:

STRUCTURE (3-4 paragraphs, 250-400 words):
1. Hook: Strong opening that shows knowledge of company/role
2. Value: Specific achievements that align with job requirements  
3. Fit: Why you're perfect for this role and company
4. Close: Confident call-to-action

TONE: ${tone}, confident, specific, enthusiastic
STYLE: Focus on what you can deliver, not what you want
KEYWORDS: Naturally integrate job-relevant terms from ALLOWED_SKILLS
RESTRICTIONS: Don't claim experience with JOB_ONLY_SKILLS - instead express eagerness to learn
` : ''}

🚫 NEVER FABRICATE:
- Employment dates, company names, or job titles
- Metrics, percentages, or quantifiable results
- Skills not in ALLOWED_SKILLS
- Educational credentials or grades

ALLOWED_SKILLS: ${allowedSkillsCSV}
JOB_ONLY_SKILLS: ${jobOnlySkillsCSV}
`.trim();

    const resumePayload = resumeData ? JSON.stringify(resumeData) : resumeText;
    const userPromptParts = [`Generate JSON${coverLetterNeeded && resumeNeeded ? ' for a tailored cover letter and a revised resume (ATS-friendly)' : coverLetterNeeded ? ' for a tailored cover letter' : ' for a revised resume (ATS-friendly)'}.`];
    
    if (coverLetterNeeded) {
      userPromptParts.push(`Cover Letter Tone:\n${tone}`);
    }
    
    userPromptParts.push(`Job Description:\n${jobDesc}`);
    userPromptParts.push(`Resume Data:\n${resumePayload}`);
    
    if (coverLetterNeeded && coverText) {
      userPromptParts.push(`Previous Cover Letter (optional):\n${coverText}`);
    }
    
    const user = userPromptParts.join('\n\n');

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role:"system", content: system }, { role:"user", content: user }]
    });

    const raw = resp.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    if (!json) return res.status(502).json({ error:"Bad model output", code:"E_BAD_MODEL_OUTPUT", raw });

    // Normalize + optimize with best practices
    let rd = null;
    if (resumeNeeded) {
      const allowed = new Set(allowedSkills);
      rd = normalizeResumeData(json.resumeData || {});
      rd.skills = (rd.skills || []).filter(s => allowed.has(String(s).toLowerCase()));

      const resumeContext = resumeData ? JSON.stringify(resumeData) : resumeText;
      
      // Optimize professional summary
      rd.summary = await optimizeSummary(client, resumeContext, jobDesc, rd.summary);
      
      // Optimize experience bullets with modern best practices
      for (const exp of rd.experience || []) {
        const originalBullets = exp.bullets || [];
        const rewritten = await rewriteBullets(client, jobDesc, resumeContext, originalBullets);
        exp.bullets = await verifyBullets(client, resumeContext, originalBullets, rewritten);
      }
    }

    const payload = {
      userGoal: userGoal
    };
    
    if (coverLetterNeeded) {
      payload.coverLetter = String(json.coverLetterText || "");
    }
    
    if (resumeNeeded) {
      payload.resumeData = rd;
    }

    return res.status(200).json(payload);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error:"Server error", detail:String(err?.message || err) });
  }
}

export default withLimiter(coreHandler, { limit: 10, windowMs: 60_000 });

