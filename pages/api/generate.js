import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";
import { withLimiter } from "../../lib/ratelimit";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkCreditAvailability, consumeCredit, trackApiUsage } from '../../lib/credit-system';

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

🚨 CRITICAL ANTI-FABRICATION RULES - ZERO TOLERANCE:
- NEVER invent numbers: No percentages, metrics, dollar amounts, team sizes, timeframes, or quantified results
- NEVER add achievements: No projects, technologies, outcomes, or accomplishments not in original resume
- NEVER create metrics: No "increased by 25%", "managed team of 8", "saved $50K" unless word-for-word in RESUME_CONTEXT
- NEVER assume scale: No company revenue, budget sizes, departmental scope, or business metrics
- NEVER escalate roles: Don't change "assisted with" to "led" or "participated in" to "managed"
- NEVER add technical depth: No specific versions, advanced features, or implementation details not mentioned
- NEVER create timeframes: No "delivered ahead of schedule", "rapid deployment", or duration claims
- NEVER fabricate soft skills: No "excellent communication" or "strong leadership" without evidence
- NEVER assume organizational structure: No reporting relationships, team hierarchies, or cross-functional roles
- NEVER create business impact: No efficiency gains, process improvements, or strategic outcomes not stated
- STRICT RULE: If original bullet has no numbers, DO NOT add any - focus on strong action verbs only
- STRICT RULE: Only enhance clarity and power of existing truthful content
- STRICT RULE: When uncertain, choose weaker truthful language over stronger fabricated claims
- VERIFICATION: Each enhanced bullet must be completely defensible against original source
- ACCOUNTABILITY: Every claim must trace back to explicit content in RESUME_CONTEXT

Transform BULLETS using only information from RESUME_CONTEXT:

FORMULA: [Action Verb] + [What You Did] + [Context/Technology/Scope if mentioned]

ENHANCEMENT APPROACH:
1. START WITH POWER VERBS: Achieved, Led, Transformed, Optimized, Delivered, Implemented, Streamlined, Spearheaded, Developed, Built, Maintained, Collaborated, Supported, Analyzed

2. PRESERVE ORIGINAL FACTS:
   - Only use numbers/metrics if explicitly stated in RESUME_CONTEXT
   - Only mention technologies/tools if listed in RESUME_CONTEXT  
   - Only reference scope/scale if mentioned in RESUME_CONTEXT
   - Only claim leadership if indicated in RESUME_CONTEXT

3. FOCUS ON TRUTHFUL IMPACT:
   - Highlight the nature of work done (development, analysis, support, etc.)
   - Emphasize technologies used (only if mentioned)
   - Note collaboration and teamwork (only if indicated)
   - Describe processes and methodologies (only if mentioned)

4. AVOID WEAK LANGUAGE:
   - Remove: "Responsible for", "Duties included", "Worked on"
   - Replace with specific action verbs that reflect the actual work

5. STRUCTURE: 15-25 words max, clear and concise

6. KEYWORDS: Naturally integrate relevant JOB_DESC terms ONLY when supported by RESUME_CONTEXT`;

  const user = `JOB_DESCRIPTION:\n${jobDesc}\n\nRESUME_CONTEXT:\n${resumeContext}\n\nBULLETS TO OPTIMIZE:\n${JSON.stringify(bullets)}`;
  
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1, // Reduced for more consistent, factual output
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

🚨 CRITICAL: Only use information explicitly stated in RESUME_CONTEXT. Never fabricate experience years, metrics, or achievements.

Create a professional summary using information from RESUME_CONTEXT only:

STRUCTURE (2-3 sentences, 50-80 words):
1. Professional title + experience level (only if clearly stated in resume)
2. Key technologies/skills mentioned in resume
3. Value proposition based on actual experience shown in resume

STRICT RULES:
- Start with professional identity from resume (e.g., "Software Engineer", "Developer", etc.)
- Use power words (achieved, led, transformed, optimized, delivered) only if supported by resume
- Include specific metrics ONLY when explicitly stated in RESUME_CONTEXT
- Mention 2-3 most relevant technical skills from resume
- Focus on demonstrated capabilities from resume experience
- Avoid generic phrases like "results-driven" or "team player"
- Write in third person, no "I" statements
- NEVER add experience years, company scales, or achievements not in resume

TONE: Professional, factual, based on actual resume content`;

  const user = `JOB_DESCRIPTION:\n${jobDesc}\n\nRESUME_CONTEXT:\n${resumeContext}\n\nCURRENT_SUMMARY:\n${currentSummary || "No existing summary"}`;
  
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1, // Reduced for more consistent, less creative output
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

    // Check user authentication and credits
    let userId = null;
    let generationCount = 1; // Default to 1 for single item
    
    if (userGoal === 'both') {
      generationCount = 2; // Both resume and cover letter = 2 generations
    }
    
    try {
      const session = await getServerSession(req, res, authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
        
        // Check credit availability for the required generation count
        for (let i = 0; i < generationCount; i++) {
          const creditCheck = await checkCreditAvailability(userId, 'generation');
          if (!creditCheck.allowed) {
            return res.status(429).json({ 
              error: 'Limit exceeded', 
              message: creditCheck.message,
              credits: creditCheck.credits,
              plan: creditCheck.plan
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    }

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
    
    // Create optimized prompts based on user goal to save OpenAI credits
    let system = '';
    
    if (userGoal === 'cv') {
      // CV-only prompt (70% shorter, focused)
      system = `You are a professional resume writer. Output ONLY JSON: { "resumeData": {...} }

🎯 Create ATS-friendly resume using original resume data only.

📋 RULES:
- Power verbs: Led, Built, Delivered, Optimized
- 3-5 bullets per role (no duties)
- Skills ONLY from: ${allowedSkillsCSV}
- ⚠️ NEVER fabricate metrics/achievements
- Standard headers: Experience, Education, Skills
- For JOB_ONLY skills (${jobOnlySkillsCSV}): Don't mention unless explicitly in original`.trim();

    } else if (userGoal === 'cover-letter') {
      // Cover letter-only prompt (65% shorter, focused) 
      system = `You are a cover letter writer. Output ONLY JSON: { "coverLetterText": "..." }

🎯 Write ${tone} cover letter (250-400 words) using only original resume info.

📝 RULES:
- 4 paragraphs: Hook → Value → Fit → Close
- Only skills from: ${allowedSkillsCSV}
- ⚠️ NEVER fabricate experience not in resume
- For JOB_ONLY (${jobOnlySkillsCSV}): "eager to learn X"
- Tone: ${tone}`.trim();

    } else {
      // Both - streamlined comprehensive prompt (40% shorter)
      system = `You are a professional resume & cover letter writer. Output ONLY JSON: { "resumeData": {...}, "coverLetterText": "..." }

🎯 Create ATS resume + ${tone} cover letter from original resume only.

📋 RESUME: Power verbs, 3-5 bullets/role, standard headers
📝 COVER LETTER: 4 paragraphs, 250-400 words, ${tone} tone
⚠️ SKILLS: Only use ${allowedSkillsCSV}
⚠️ JOB_ONLY (${jobOnlySkillsCSV}): Express learning interest only
⚠️ CRITICAL: Never fabricate metrics, achievements, or experience not in original`.trim();
    }

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
      temperature: 0.1, // Reduced temperature for more factual, less creative output
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
      
      // For cover letter only, preserve essential user info for signing
      if (!resumeNeeded && resumeData) {
        payload.name = resumeData.name;
        payload.email = resumeData.email;
        payload.phone = resumeData.phone;
      }
    }
    
    if (resumeNeeded) {
      payload.resumeData = rd;
    }

    // Track usage and consume credits after successful generation
    if (userId) {
      try {
        // Consume the appropriate number of credits and track API usage
        for (let i = 0; i < generationCount; i++) {
          await consumeCredit(userId, 'generation');
          await trackApiUsage(userId, 'generation');
        }
      } catch (error) {
        console.error('Error tracking usage:', error);
        // Don't block the response if tracking fails
      }
    }

    return res.status(200).json(payload);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error:"Server error", detail:String(err?.message || err) });
  }
}

export default withLimiter(coreHandler, { limit: 10, windowMs: 60_000 });

