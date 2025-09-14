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
import { checkTrialLimit, consumeTrialUsage } from '../../lib/trialUtils';

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

// ---- NEW: consolidate long skills into concise 1-2 word terms ----
async function consolidateSkills(client, skills){
  if(!skills || skills.length === 0) return skills;
  
  // Filter out skills that are already concise (1-2 words)
  const longSkills = [];
  const shortSkills = [];
  
  skills.forEach(skill => {
    const wordCount = String(skill).trim().split(/\s+/).length;
    if (wordCount <= 2) {
      shortSkills.push(skill);
    } else {
      longSkills.push(skill);
    }
  });
  
  // If no long skills to consolidate, return original array
  if (longSkills.length === 0) return skills;
  
  try {
    const sys = `Output ONLY JSON: {"skills": string[]} Convert long skill descriptions into concise 1-2 word professional skill terms.

RULES:
1. Convert each skill to 1-2 words maximum
2. Keep core technical/professional competency
3. Use industry-standard terminology
4. Remove filler words, explanations, context
5. Maintain the SAME ORDER as input

EXAMPLES:
- "Experience with JavaScript programming and web development" → "JavaScript"
- "Proficient in project management and team leadership" → "Project Management"
- "Strong analytical and problem-solving abilities" → "Problem Solving"
- "Customer service and client relationship management" → "Customer Service"
- "Database administration and SQL optimization" → "Database Administration"`;

    const user = `Consolidate these skills into concise terms:\n${longSkills.map((skill, i) => `${i + 1}. ${skill}`).join('\n')}`;
    
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role:"system", content: sys }, { role:"user", content: user }]
    });
    
    const result = safeJSON(r.choices?.[0]?.message?.content || '{"skills": []}');
    const consolidatedSkills = Array.isArray(result.skills) 
      ? result.skills.map(s => String(s).trim()).filter(Boolean)
      : longSkills; // fallback to original if AI fails
    
    // Combine short skills + consolidated long skills, removing duplicates
    const allSkills = [...shortSkills, ...consolidatedSkills];
    const uniqueSkills = [];
    const seen = new Set();
    
    allSkills.forEach(skill => {
      const lowerSkill = String(skill).toLowerCase();
      if (!seen.has(lowerSkill)) {
        seen.add(lowerSkill);
        uniqueSkills.push(skill);
      }
    });
    
    return uniqueSkills;
  } catch (error) {
    console.error('Error consolidating skills:', error);
    return skills; // fallback to original skills
  }
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
    const language   = Array.isArray(fields?.language) ? fields.language[0] : (fields?.language || "en-US");

    // Check user authentication and credits (or trial limits)
    let userId = null;
    let generationCount = 1; // Default to 1 for single item
    let isTrialUser = false;
    
    if (userGoal === 'both') {
      generationCount = 2; // Both resume and cover letter = 2 generations
    }
    
    try {
      const session = await getServerSession(req, res, authOptions);
      if (session?.user?.id) {
        // Authenticated user - use credit system
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
      } else {
        // Anonymous user - use trial system
        isTrialUser = true;
        console.log('Trial user detected, userGoal:', userGoal);
        
        // For trial users, only allow 'both' option (enforced by UI but double-check here)
        if (userGoal !== 'both') {
          console.log('Trial user tried to use goal other than both:', userGoal);
          return res.status(400).json({ 
            error: 'Trial users can only generate both CV and cover letter together. Please sign up for individual options.',
            code: 'TRIAL_BOTH_ONLY'
          });
        }
        
        // Check trial limits (we consume 2 generations for both CV + cover letter)
        console.log('Checking trial limits for generation count:', generationCount);
        const trialCheck = await checkTrialLimit(req, 'generation');
        console.log('Trial check result:', trialCheck);
        // We need at least 2 generations remaining since we consume 2 (CV + cover letter)
        if (!trialCheck.allowed || trialCheck.remaining < 2) {
          console.log('Trial limit exceeded');
          const messageText = trialCheck.remaining === 0 
            ? `You've used both of your free trial generations. Sign up for unlimited access!`
            : `Trial generates both CV and cover letter together, requiring 2 generations. You have ${trialCheck.remaining} remaining but need 2. Sign up for unlimited access!`;
          
          return res.status(429).json({ 
            error: 'Trial limit reached', 
            message: messageText,
            code: 'TRIAL_GENERATION_LIMIT'
          });
        }
        console.log('Trial user passed all checks');
      }
    } catch (error) {
      console.error('Error checking user session or trial limits:', error);
      // For trial users, if there's an error checking limits, allow the request (fail open)
      if (!userId) {
        isTrialUser = true;
      }
    }

    if (!resumeData && !resumeText) return res.status(400).json({ error:"No readable resume", code:"E_NO_RESUME" });
    
    // More lenient job description validation for trial users (10 chars vs 30 for authenticated users)
    const minJobDescLength = isTrialUser ? 10 : 30;
    if (!jobDesc || jobDesc.trim().length < minJobDescLength) {
      return res.status(400).json({ 
        error: `Job description too short (minimum ${minJobDescLength} characters)`, 
        code:"E_BAD_INPUT" 
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Pass 1: résumé-only allow-list (consolidate long skills first)
    let allowedSkillsBase = resumeData
      ? (resumeData.skills || [])
      : await extractAllowedSkills(client, resumeText);
    
    // Consolidate long skills into concise terms
    allowedSkillsBase = await consolidateSkills(client, allowedSkillsBase);
    
    // Convert to lowercase for matching
    const allowedSkillsLower = allowedSkillsBase.map(s=>String(s).toLowerCase());
    const allowedSkills = await expandSkills(client, allowedSkillsLower);
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
    
    // Language-specific terms and instructions
    const getLanguageTerms = (lang) => {
      if (lang === 'en-UK') {
        return {
          resume: 'CV',
          spelling: 'British English spelling and terminology (colour, analyse, organised, specialise)',
          tone: 'formal British tone',
          verbs: 'Led, Built, Delivered, Optimised, Organised, Specialised'
        };
      }
      return {
        resume: 'resume',
        spelling: 'American English spelling and terminology (color, analyze, organized, specialize)',
        tone: 'professional American tone',
        verbs: 'Led, Built, Delivered, Optimized, Organized, Specialized'
      };
    };
    
    const langTerms = getLanguageTerms(language);

    // Create optimized prompts based on user goal to save OpenAI credits
    let system = '';
    
    if (userGoal === 'cv') {
      // CV-only prompt (70% shorter, focused)
      system = `You are a professional ${langTerms.resume} writer. Output ONLY JSON: { "resumeData": {...} }

🎯 Create ATS-friendly ${langTerms.resume} using original ${langTerms.resume} data only.

📋 RULES:
- Power verbs: ${langTerms.verbs}
- 3-5 bullets per role (no duties)
- Skills ONLY from: ${allowedSkillsCSV}
- ⚠️ NEVER fabricate metrics/achievements
- Standard headers: Experience, Education, Skills
- For JOB_ONLY skills (${jobOnlySkillsCSV}): Don't mention unless explicitly in original
- LANGUAGE: Use ${langTerms.spelling} with ${langTerms.tone}`.trim();

    } else if (userGoal === 'cover-letter') {
      // Cover letter-only prompt (65% shorter, focused) 
      system = `You are a cover letter writer. Output ONLY JSON: { "coverLetterText": "..." }

🎯 Write ${tone} cover letter (250-400 words) using only original ${langTerms.resume} info.

📝 RULES:
- 4 paragraphs: Hook → Value → Fit → Close
- Only skills from: ${allowedSkillsCSV}
- ⚠️ NEVER fabricate experience not in ${langTerms.resume}
- For JOB_ONLY (${jobOnlySkillsCSV}): "eager to learn X"
- Tone: ${tone}
- LANGUAGE: Use ${langTerms.spelling} with ${langTerms.tone}`.trim();

    } else {
      // Both - streamlined comprehensive prompt (40% shorter)
      system = `You are a professional ${langTerms.resume} & cover letter writer. Output ONLY JSON: { "resumeData": {...}, "coverLetterText": "..." }

🎯 Create ATS ${langTerms.resume} + ${tone} cover letter from original ${langTerms.resume} only.

📋 ${langTerms.resume.toUpperCase()}: Power verbs (${langTerms.verbs}), 3-5 bullets/role, standard headers
📝 COVER LETTER: 4 paragraphs, 250-400 words, ${tone} tone
⚠️ SKILLS: Only use ${allowedSkillsCSV}
⚠️ JOB_ONLY (${jobOnlySkillsCSV}): Express learning interest only
⚠️ CRITICAL: Never fabricate metrics, achievements, or experience not in original
⚠️ LANGUAGE: Use ${langTerms.spelling} with ${langTerms.tone}`.trim();
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
      
      // Filter skills and ensure consolidated skills are preserved
      const filteredSkills = (rd.skills || []).filter(s => allowed.has(String(s).toLowerCase()));
      
      // Add consolidated base skills that might not be in the expanded set
      const consolidatedSet = new Set(filteredSkills.map(s => s.toLowerCase()));
      allowedSkillsBase.forEach(skill => {
        if (!consolidatedSet.has(skill.toLowerCase())) {
          filteredSkills.push(skill);
          consolidatedSet.add(skill.toLowerCase());
        }
      });
      
      rd.skills = filteredSkills;

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

    // Track usage and consume credits/trial usage after successful generation
    if (userId) {
      try {
        // Authenticated user - consume credits and track API usage
        for (let i = 0; i < generationCount; i++) {
          await consumeCredit(userId, 'generation');
          await trackApiUsage(userId, 'generation');
        }
      } catch (error) {
        console.error('Error tracking usage:', error);
        // Don't block the response if tracking fails
      }
    } else if (isTrialUser) {
      try {
        // Trial user - consume trial usage (consume 2 for both CV + cover letter)
        await consumeTrialUsage(req, 'generation');
        await consumeTrialUsage(req, 'generation');
        console.log(`Trial user consumed 2 generations (${generationCount} items generated)`);
      } catch (error) {
        console.error('Error tracking trial usage:', error);
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

