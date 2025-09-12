import OpenAI from 'openai';
import { normalizeResumeData } from '../../lib/normalizeResume';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkCreditAvailability, consumeCredit, trackApiUsage, getUserEntitlementWithCredits } from '../../lib/credit-system';

// ---- JSON helpers ----
function stripCodeFence(s=""){
  const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : s;
}
function safeJSON(s){ try{ return JSON.parse(stripCodeFence(s)); } catch { return null; } }

// ---- Extract allowed skills strictly from résumé ----
async function extractAllowedSkills(client, resumeData){
  const resumeText = JSON.stringify(resumeData);
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

// ---- Extract skills from job description ----
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

// ---- Dynamically expand skills with synonyms ----
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

// ---- Post-process bullets with action verbs/metrics ----
async function rewriteBullets(client, jobDesc, resumeContext, bullets){
  if(!bullets || bullets.length === 0) return bullets;
  const sys = "Output ONLY JSON: {\\\"bullets\\\": string[]} Rephrase BULLETS using strong action verbs and relevant JOB_DESC keywords supported by RESUME_CONTEXT. CRITICAL: Do not fabricate numbers, percentages, metrics, team sizes, or any quantified outcomes not in RESUME_CONTEXT. Do not fabricate skills or experience. Keep each bullet under 25 words.";
  const user = `JOB_DESC:\n${jobDesc}\nRESUME_CONTEXT:\n${resumeContext}\nBULLETS:${JSON.stringify(bullets)}`;
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [{ role:"system", content: sys }, { role:"user", content: user }]
  });
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  const arr = Array.isArray(out?.bullets) ? out.bullets.map(b=>String(b).trim()).filter(Boolean) : null;
  return arr && arr.length === bullets.length ? arr : bullets;
}

// ---- Verify rewritten bullets against resume ----
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userData, jobDescription } = req.body;

  if (!userData || !jobDescription) {
    return res.status(400).json({ error: 'User data and job description are required' });
  }

  // Check user authentication and credits
  let userId = null;
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      
      // Check if user has available credits
      const creditCheck = await checkCreditAvailability(userId, 'generation');
      if (!creditCheck.allowed) {
        return res.status(429).json({ 
          error: 'Credits exhausted', 
          message: creditCheck.message,
          credits: creditCheck.credits,
          plan: creditCheck.plan
        });
      }
    }
  } catch (error) {
    console.error('Error checking user credits:', error);
    // Continue without credits for now (but we could make this required)
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  if (!jobDescription || jobDescription.trim().length < 30) {
    return res.status(400).json({ error: "Job description too short", code: "E_BAD_INPUT" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resumeData = userData.resumeData;
    const tone = 'professional';

    // Pass 1: résumé-only allow-list
    const allowedSkillsBase = resumeData
      ? (resumeData.skills || []).map(s=>String(s).toLowerCase())
      : await extractAllowedSkills(client, resumeData);
    const allowedSkills = await expandSkills(client, allowedSkillsBase);
    const expanded = new Set(allowedSkills);
    const allowedSkillsCSV = allowedSkills.join(", ");

    // Pass 2: derive job-only skills
    const jobSkills = await extractJobSkills(client, jobDescription);
    const jobOnlySkills = jobSkills.filter(s => !expanded.has(s));
    const jobOnlySkillsCSV = jobOnlySkills.join(", ");

    // Pass 3: generate with hard constraints - EXACT SAME SYSTEM PROMPT AS generate.js
    const system = `
You output ONLY JSON with keys:
- coverLetterText: string
- resumeData: object (name, title?, email?, phone?, location?, summary?, links[], skills[], experience[], education[])

STRICT RULES:
- Treat ALLOWED_SKILLS as an allow-list. resumeData.skills MUST be a subset of ALLOWED_SKILLS.
- Do NOT add tools/tech/frameworks in skills or experience if they are not in ALLOWED_SKILLS.
- For resumeData.experience[], each item must include company, title, start, end, location?, bullets[]. Start/end dates must come from the candidate's resume and must not be fabricated. Bullets must begin with strong action verbs and align with job description keywords that are supported by the resume.
- For resumeData.education[], each item must include school, degree, start, end, grade? Dates and grade must come from the candidate's resume and must not be fabricated.
🚨 COVER LETTER CRITICAL RULES:
- The coverLetterText MUST NOT claim direct experience with JOB_ONLY_SKILLS or any skills not in ALLOWED_SKILLS
- NEVER fabricate achievements, metrics, or accomplishments not explicitly stated in original resume
- NEVER invent project outcomes, team leadership, or quantified results 
- NEVER overstate experience level or claim expertise beyond what's demonstrated in resume
- When mentioning JOB_ONLY_SKILLS, express willingness to learn using phrasing like "While I haven't used X directly, my experience with Y provides a strong foundation for learning it"
- ONLY reference accomplishments, projects, and experience explicitly mentioned in the original resume
- The coverLetterText must adopt a ${tone} tone while remaining truthful.
- The resume must be ATS-optimized: use plain formatting, concise bullet points beginning with strong action verbs, and integrate relevant keywords from the job description where applicable. Avoid tables or images.

🚫 NEVER FABRICATE OR ASSUME:
- Numbers, percentages, metrics, dollar amounts, team sizes, or timeframes
- Revenue figures, budget sizes, cost savings, or financial impacts  
- Performance improvements like "increased efficiency by X%" unless explicitly in original resume
- Quantifiable results or achievements not in original resume
- Employers, dates, credentials, company information, or project scales
- RULE: If a metric isn't explicitly stated in the original resume, DO NOT create one
- RULE: Focus on strong action verbs and qualitative impact instead of fake numbers
ALLOWED_SKILLS: ${allowedSkillsCSV}
JOB_ONLY_SKILLS: ${jobOnlySkillsCSV}
`.trim();

    const resumePayload = JSON.stringify(resumeData);
    const user = `
Generate JSON for a tailored cover letter and a revised resume (ATS-friendly).

Cover Letter Tone:
${tone}

Job Description:
${jobDescription}

Resume Data:
${resumePayload}

Previous Cover Letter (optional):
${userData.coverLetter || ''}
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

    // Normalize + enforce subset in code - EXACT SAME LOGIC AS generate.js
    const allowed = new Set(allowedSkills);
    const rd = normalizeResumeData(json.resumeData || {});
    rd.skills = (rd.skills || []).filter(s => allowed.has(String(s).toLowerCase()));

    const resumeContext = JSON.stringify(resumeData);
    for (const exp of rd.experience || []) {
      const originalBullets = exp.bullets || [];
      const rewritten = await rewriteBullets(client, jobDescription, resumeContext, originalBullets);
      exp.bullets = await verifyBullets(client, resumeContext, originalBullets, rewritten);
    }

    const payload = {
      ...userData,
      resumeData: rd,
      coverLetter: String(json.coverLetterText || ""),
    };

    // Consume credit and track usage after successful generation
    if (userId) {
      await consumeCredit(userId, 'generation');
      await trackApiUsage(userId, 'generation');
    }

    return res.status(200).json(payload);

  } catch (error) {
    console.error('Tailoring error:', error);
    return res.status(500).json({ 
      error: 'Failed to tailor content', 
      detail: error.message 
    });
  }
}