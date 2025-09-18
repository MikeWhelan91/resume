import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import aiService from "../../lib/ai-service";
import { normalizeResumeData } from "../../lib/normalizeResume";
import { withLimiter } from "../../lib/ratelimit";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkCreditAvailability, consumeCredit, trackApiUsage } from '../../lib/credit-purchase-system';
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

// ---- ATS Compatibility Analysis Function ----
async function analyzeATSCompatibility(resumeData, template = 'ats', jobDescription = '', aiService = null) {
  if (!resumeData) return null;

  // If we have jobDescription and aiService, use AI analysis
  if (jobDescription && jobDescription.trim().length > 50 && aiService) {
    try {
      console.log('ATS Analysis - Raw resumeData structure:', JSON.stringify(resumeData, null, 2));
      console.log('ATS Analysis - resumeData keys:', Object.keys(resumeData || {}));

      const resumeText = formatResumeForAnalysis(resumeData);
      console.log('ATS Analysis - Formatted resume text length:', resumeText.length);
      console.log('ATS Analysis - Formatted resume text preview:', resumeText.substring(0, 500) + '...');

      if (resumeText.length < 100) {
        console.warn('ATS Analysis - Resume text is too short, likely missing data!');
      }

      const analysisResponse = await aiService.chatCompletion([
          {
            role: "system",
            content: `You are an expert ATS (Applicant Tracking System) compatibility analyzer. Your task is to analyze a resume for compatibility with automated screening systems used by employers.

Focus specifically on:
1. Keyword optimization for automated scanning (PRIMARY FOCUS)
2. Content relevance and completeness
3. Industry-specific terminology alignment
4. Missing skills and qualifications from job description
5. Content gaps that hurt ATS ranking

NOTE: This resume uses a professionally designed ATS-optimized template with proper formatting, fonts, and structure. Focus analysis on CONTENT OPTIMIZATION rather than template formatting issues.

Return your analysis as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "categories": {
    "keywordOptimization": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    },
    "contentRelevance": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    },
    "skillsAlignment": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    },
    "completeness": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    }
  },
  "keywordGaps": [
    {
      "keyword": "<missing important keyword>",
      "importance": "<high|medium|low>",
      "suggestions": ["<where and how to add it>"]
    }
  ],
  "issues": ["<specific ATS compatibility issues found>"],
  "quickWins": ["<immediate improvements for ATS compatibility>"],
  "strengths": ["<what works well for ATS systems>"]
}`
          },
          {
            role: "user",
            content: `Please analyze this resume for ATS (Applicant Tracking System) compatibility against the following job description.

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeText}

Focus specifically on CONTENT OPTIMIZATION for ATS systems:
1. Identify truly MISSING keywords that would significantly improve ATS ranking
2. Look for synonyms and related terms already present (e.g., "service requests" vs "service inquiries")
3. Focus on HIGH-IMPACT missing qualifications or skills
4. Content relevance and alignment gaps with position requirements
5. Missing industry-specific certifications or technical skills
6. Experience descriptions that could better highlight relevant achievements

IMPORTANT KEYWORD ANALYSIS RULES:
- Only flag keywords as "missing" if there are NO similar terms or synonyms present
- Consider semantic similarity (e.g., "customer service" = "customer support")
- Focus on substantial gaps, not minor wording differences
- Prioritize technical skills, certifications, and specific qualifications over common terms
- The resume already uses proper ATS formatting - focus on meaningful content gaps only

Provide realistic, high-impact content recommendations that would genuinely improve ATS performance.`
          }
        ], {
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 2000
        });

      const analysisText = analysisResponse.choices[0].message.content;

      try {
        // Remove any markdown formatting and parse JSON
        const cleanedResponse = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(cleanedResponse);

        // Validate analysis structure
        if (analysis.overallScore && analysis.categories) {
          return analysis;
        }
      } catch (parseError) {
        console.error('Failed to parse ATS analysis JSON:', parseError);
      }
    } catch (error) {
      console.error('AI ATS analysis error:', error);
    }
  }

  // Fallback to basic analysis if AI fails or no job description
  try {
    const score = {
      overallScore: 85, // Base score for ATS template
      categories: {
        formatting: { score: 95, analysis: 'Standard formatting detected', recommendations: [] },
        headers: { score: 90, analysis: 'Clear section headers present', recommendations: [] },
        structure: { score: 88, analysis: 'Logical resume structure maintained', recommendations: [] },
        keywords: { score: 75, analysis: 'Basic keyword optimization', recommendations: [] }
      },
      quickWins: [],
      issues: [],
      strengths: [
        'Standard Arial font used',
        'Clear section headers detected',
        'Simple bullet point format',
        'No complex tables or graphics',
        'Machine-readable layout'
      ]
    };

    // Check for common ATS issues
    if (template === 'ats') {
      score.categories.formatting.score = 98;
      score.categories.headers.score = 95;
      score.categories.structure.score = 92;
      score.overallScore = 92;
      score.strengths.push('ATS-optimized template selected');
    } else {
      // Non-ATS templates have formatting issues
      score.categories.formatting.score = 65;
      score.categories.headers.score = 70;
      score.overallScore = 72;
      score.issues.push('Custom formatting may not be ATS-friendly');
      score.quickWins.push('Consider using ATS-optimized template');
    }

    // Analyze content for ATS optimization
    const skills = resumeData.skills || [];
    const experience = resumeData.experience || [];

    if (skills.length < 5) {
      score.categories.keywords.score -= 10;
      score.quickWins.push('Add more relevant skills and keywords');
    }

    if (experience.length === 0) {
      score.categories.structure.score -= 15;
      score.quickWins.push('Add professional experience section');
    }

    // Check for standard headers
    const hasStandardSections = {
      summary: !!resumeData.summary,
      skills: skills.length > 0,
      experience: experience.length > 0,
      education: resumeData.education && resumeData.education.length > 0
    };

    const sectionCount = Object.values(hasStandardSections).filter(Boolean).length;
    if (sectionCount < 3) {
      score.categories.structure.score -= 10;
      score.quickWins.push('Include all standard sections (Summary, Skills, Experience, Education)');
    }

    // Recalculate overall score
    const avgCategoryScore = Object.values(score.categories).reduce((sum, cat) => sum + cat.score, 0) / 4;
    score.overallScore = Math.round(avgCategoryScore);

    return score;
  } catch (error) {
    console.error('ATS compatibility analysis error:', error);
    return {
      overallScore: 85,
      categories: {
        formatting: { score: 85, analysis: 'Basic compatibility maintained', recommendations: [] },
        headers: { score: 85, analysis: 'Standard headers present', recommendations: [] },
        structure: { score: 85, analysis: 'Acceptable structure', recommendations: [] },
        keywords: { score: 85, analysis: 'Standard keyword usage', recommendations: [] }
      },
      quickWins: ['Unable to perform detailed analysis'],
      issues: [],
      strengths: ['Basic ATS compatibility maintained']
    };
  }
}

// ---- Job Match Analysis Function ----
async function analyzeJobMatchScore(aiService, resumeData, jobDescription) {
  if (!jobDescription || !resumeData) return null;

  try {
    // Convert resume data to text for analysis
    const resumeText = formatResumeForAnalysis(resumeData);

    const response = await aiService.chatCompletion([
        {
          role: "system",
          content: `You are analyzing how well a resume matches a specific job description. Focus on CONTENT GAPS and MISSING ELEMENTS that the user needs to address for this specific job:

Return JSON:
{
  "overallScore": <number 70-95>,
  "categories": {
    "keywordMatch": {"score": <number>, "gaps": ["missing critical keywords from job"]},
    "contentDepth": {"score": <number>, "gaps": ["missing experience details", "quantifiable achievements"]},
    "relevance": {"score": <number>, "gaps": ["skills not demonstrated", "experience misalignment"]},
    "completeness": {"score": <number>, "gaps": ["missing sections", "incomplete information"]}
  },
  "contentGaps": [
    "Specific missing experience or skills from job requirements",
    "Achievement areas that need quantification",
    "Critical qualifications not highlighted"
  ],
  "missingKeywords": ["job-critical", "keywords", "missing"],
  "recommendations": [
    "Add specific experience in X",
    "Quantify achievements in Y role",
    "Highlight Z skills more prominently"
  ]
}`
        },
        {
          role: "user",
          content: `Focus on CONTENT analysis: What experience, skills, or achievements is the candidate missing for this specific job? What gaps exist between their background and job requirements?

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeText}

What content gaps exist? What should the user add to their experience to better match this role?`
        }
      ], {
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 1200
      });

    const analysisText = response.choices[0].message.content;
    const analysis = safeJSON(analysisText);

    return analysis?.overallScore ? analysis : null;
  } catch (error) {
    console.error('ATS analysis error:', error);
    return null;
  }
}

function formatResumeForAnalysis(resumeData) {
  let text = '';

  // Handle both direct and nested data structures
  const data = resumeData.resumeData || resumeData;

  console.log('formatResumeForAnalysis - Input data keys:', Object.keys(resumeData || {}));
  console.log('formatResumeForAnalysis - Using data keys:', Object.keys(data || {}));

  if (data.name) text += `Name: ${data.name}\n`;
  if (data.email) text += `Email: ${data.email}\n`;
  if (data.phone) text += `Phone: ${data.phone}\n`;
  if (data.location) text += `Location: ${data.location}\n`;

  if (data.summary) {
    text += `\nPROFESSIONAL SUMMARY:\n${data.summary}\n`;
  }

  if (data.experience && data.experience.length > 0) {
    text += '\nWORK EXPERIENCE:\n';
    data.experience.forEach(exp => {
      const title = exp.title || exp.jobTitle || 'Position';
      const company = exp.company || exp.companyName || 'Company';
      const start = exp.start || exp.startDate || '';
      const end = exp.end || exp.endDate || 'Present';
      const duration = exp.duration || exp.dates || exp.period || `${start} - ${end}`;

      // Handle both bullets array and description string
      const bullets = exp.bullets || exp.responsibilities || exp.details || [];
      const description = exp.description || '';

      text += `${title} at ${company} (${duration})\n`;

      // Add description if it exists
      if (description) {
        text += `${description}\n`;
      }

      // Add bullets if they exist
      if (Array.isArray(bullets) && bullets.length > 0) {
        bullets.forEach(bullet => {
          text += `• ${bullet}\n`;
        });
      } else if (typeof bullets === 'string' && bullets) {
        text += `• ${bullets}\n`;
      }

      text += '\n';
    });
  }

  if (data.skills && data.skills.length > 0) {
    text += `SKILLS:\n${data.skills.join(', ')}\n\n`;
  }

  if (data.coreCompetencies && data.coreCompetencies.length > 0) {
    text += `CORE COMPETENCIES:\n${data.coreCompetencies.join(', ')}\n\n`;
  }

  if (data.education && data.education.length > 0) {
    text += 'EDUCATION:\n';
    data.education.forEach(edu => {
      const degree = edu.degree || edu.qualification || 'Degree';
      const institution = edu.institution || edu.school || edu.university || 'Institution';
      const year = edu.year || edu.graduationYear || edu.date || 'Year';

      text += `${degree} from ${institution} (${year})\n`;
    });
  }

  return text;
}

// ---- NEW: pass 1 — inventory skills strictly from résumé ----
async function extractAllowedSkills(aiService, resumeText){
  const sys = "Output ONLY JSON: {\"skills\": string[]} Extract skills mentioned IN THE RESUME TEXT ONLY. No guessing or synonyms. Ignore any job description.";
  const user = `RESUME_TEXT:\n${resumeText}`;
  const r = await aiService.chatCompletion([
    { role:"system", content: sys },
    { role:"user", content: user }
  ], {
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const inv = safeJSON(r.choices?.[0]?.message?.content || "") || {};
  const skills = Array.isArray(inv.skills) ? inv.skills.map(s=>String(s).trim()).filter(Boolean) : [];
  const uniq = Array.from(new Set(skills.map(s=>s.toLowerCase())));
  return uniq;
}

// ---- NEW: combined skills processing for efficiency ----
async function processAllSkills(aiService, resumeData, resumeText, projects, jobDesc) {
  const sys = `JSON output: {
    "resumeSkills": string[],
    "projectSkills": string[],
    "jobSkills": string[],
    "consolidatedSkills": string[],
    "expandedSkills": string[]
  }

Extract only explicitly mentioned skills:
1. resumeSkills: Technical skills from resume text only
2. projectSkills: Technologies from project descriptions only
3. jobSkills: Technical requirements from job posting only
4. consolidatedSkills: Combine resume+project skills, remove duplicates, max 15
5. expandedSkills: Add common variants (React/ReactJS, Node/NodeJS)

Rule: Only extract what's explicitly written. No assumptions.`;

  const projectBullets = projects?.length > 0
    ? projects.map(p => (p.bullets || []).join(' ')).filter(Boolean).join(' ')
    : '';

  const resumeSkillsText = resumeData
    ? `SKILLS: ${(resumeData.skills || []).join(', ')}\nEXPERIENCE: ${resumeData.experience?.map(e => (e.bullets || []).join(' ')).join(' ')}`
    : resumeText;

  const user = `RESUME_CONTENT:\n${resumeSkillsText}\n\nPROJECT_BULLETS:\n${projectBullets}\n\nJOB_DESCRIPTION:\n${jobDesc}`;

  try {
    const r = await aiService.chatCompletion([
      { role:"system", content: sys },
      { role:"user", content: user }
    ], {
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 1000, // Speed optimization for skills
      top_p: 0.9
    });

    const result = safeJSON(r.choices?.[0]?.message?.content || '{}');

    return {
      resumeSkills: Array.isArray(result.resumeSkills) ? result.resumeSkills : [],
      projectSkills: Array.isArray(result.projectSkills) ? result.projectSkills : [],
      jobSkills: Array.isArray(result.jobSkills) ? result.jobSkills : [],
      consolidatedSkills: Array.isArray(result.consolidatedSkills) ? result.consolidatedSkills : [],
      expandedSkills: Array.isArray(result.expandedSkills) ? result.expandedSkills : []
    };
  } catch (error) {
    console.error('Error processing skills:', error);
    return {
      resumeSkills: resumeData ? (resumeData.skills || []) : [],
      projectSkills: [],
      jobSkills: [],
      consolidatedSkills: [],
      expandedSkills: []
    };
  }
}

// ---- NEW: inventory skills from job description ----
async function extractJobSkills(aiService, jobDesc){
  const sys = "Output ONLY JSON: {\\\"skills\\\": string[]} Extract skills explicitly mentioned IN THE JOB DESCRIPTION ONLY. No guessing or synonyms.";
  const user = `JOB_DESCRIPTION:\n${jobDesc}`;
  const r = await aiService.chatCompletion([
    { role:"system", content: sys },
    { role:"user", content: user }
  ], {
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const inv = safeJSON(r.choices?.[0]?.message?.content || "") || {};
  const skills = Array.isArray(inv.skills) ? inv.skills.map(s=>String(s).trim()).filter(Boolean) : [];
  const uniq = Array.from(new Set(skills.map(s=>s.toLowerCase())));
  return uniq;
}

// ---- NEW: dynamically expand skills with synonyms ----
async function expandSkills(aiService, skills){
  if(!skills || skills.length === 0) return [];
  const sys = "Output ONLY JSON: {\\\"synonyms\\\": {<skill>: string[]}} For each SKILL in SKILLS, list up to three common keyword variants or synonyms that might appear in job postings.";
  const user = `SKILLS:${JSON.stringify(skills)}`;
  const r = await aiService.chatCompletion([
    { role:"system", content: sys },
    { role:"user", content: user }
  ], {
    model: "gpt-4o-mini",
    temperature: 0,
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
async function consolidateSkills(aiService, skills){
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
    
    const r = await aiService.chatCompletion([
      { role:"system", content: sys },
      { role:"user", content: user }
    ], {
      model: "gpt-4o-mini",
      temperature: 0,
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
async function rewriteBullets(aiService, jobDesc, resumeContext, bullets){
  if(!bullets || bullets.length === 0) return bullets;
  
  const sys = `JSON output: {"bullets": string[]}

Transform bullets to professional resume language:
- Use power verbs: Developed, Architected, Implemented, Optimized
- Expand basic facts with technical context
- 25-40 words per bullet
- NO fabricated metrics or timelines
- Keep truthful to original content

Examples:
"React project" → "Developed full-stack web application leveraging React for dynamic user interfaces"
"Fixed bugs" → "Diagnosed and resolved software defects through systematic debugging methodologies"`;

  const user = `JOB_DESCRIPTION:\n${jobDesc}\n\nRESUME_CONTEXT:\n${resumeContext}\n\nBULLETS TO OPTIMIZE:\n${JSON.stringify(bullets)}`;
  
  const r = await aiService.chatCompletion([
    { role:"system", content: sys },
    { role:"user", content: user }
  ], {
    model: "gpt-4o-mini",
    temperature: 0.1, // Lower for speed and consistency
    max_tokens: 1200, // Reduced for speed optimization
    top_p: 0.9
  });
  
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  const arr = Array.isArray(out?.bullets) ? out.bullets.map(b=>String(b).trim()).filter(Boolean) : null;
  return arr && arr.length === bullets.length ? arr : bullets;
}

// ---- NEW: verify rewritten bullets against resume ----
async function verifyBullets(aiService, resumeContext, original, rewritten){
  if(!rewritten || rewritten.length === 0) return rewritten;
  const sys = "Output ONLY JSON: {\\\"valid\\\": boolean[]} For each bullet in NEW_BULLETS, return true if it is fully supported by RESUME_CONTEXT or ORIGINAL_BULLETS. Return false otherwise.";
  const user = `RESUME_CONTEXT:\n${resumeContext}\nORIGINAL_BULLETS:${JSON.stringify(original)}\nNEW_BULLETS:${JSON.stringify(rewritten)}`;
  const r = await aiService.chatCompletion([
    { role:"system", content: sys },
    { role:"user", content: user }
  ], {
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const out = safeJSON(r.choices?.[0]?.message?.content || "");
  const flags = Array.isArray(out?.valid) ? out.valid : [];
  return rewritten.map((b,i)=> flags[i] ? b : original[i]);
}

// ---- NEW: combined summary optimization and job match analysis ----
async function optimizeSummaryAndJobMatch(aiService, resumeContext, jobDesc, currentSummary, resumeData, jobSkills = []){
  const sys = `Output ONLY JSON: {
    "optimizedSummary": "string",
    "jobMatchAnalysis": {
      "overallScore": number,
      "categories": {
        "keywordMatch": {"score": number, "gaps": string[]},
        "contentDepth": {"score": number, "gaps": string[]},
        "relevance": {"score": number, "gaps": string[]},
        "completeness": {"score": number, "gaps": string[]}
      },
      "contentGaps": string[],
      "missingKeywords": string[],
      "recommendations": string[]
    }
  }

🎯 DUAL OPTIMIZATION MISSION: Enhance professional summary AND analyze ATS compatibility in one comprehensive review.

📝 SUMMARY OPTIMIZATION REQUIREMENTS:

🚨 ABSOLUTE TRUTHFULNESS REQUIREMENT:
- NEVER add years of experience not explicitly stated in resume
- NEVER add company names, job titles, or roles not mentioned
- NEVER add metrics, achievements, or quantified results not in original
- NEVER add skills, technologies, or certifications not demonstrated
- NEVER add industry experience or domain expertise not evidenced
- NEVER upgrade seniority level or leadership experience
- If information is not explicitly in RESUME_CONTEXT, do not include it
- Better to have a shorter truthful summary than a longer fabricated one

ENHANCED SUMMARY STRUCTURE (2-3 sentences, 60-100 words):
1. Professional title + demonstrated expertise from resume
2. Key technologies/skills evidenced in resume with professional terminology
3. Value proposition based on actual experience shown in resume with compelling language

ADVANCED SUMMARY RULES:
- Start with professional identity from resume (e.g., "Software Engineer", "Full-Stack Developer")
- Use premium power words when supported by resume content
- Include 3-4 most relevant technical skills from resume in natural flow
- Focus on demonstrated capabilities with sophisticated language
- Write in third person, no "I" statements
- NEVER add experience years, company scales, or achievements not in resume
- Use industry-standard terminology that hiring managers expect

📊 ATS ANALYSIS REQUIREMENTS:

ANALYSIS FOCUS: This resume was AUTOMATICALLY GENERATED and ATS-OPTIMIZED by our system. Structure and format are already perfect.

Focus on CONTENT GAPS and MISSING TECHNICAL SKILLS:
- Score range: 70-95 (already optimized formatting)
- Identify TECHNICAL SKILL gaps between resume and job requirements
- Only use TECHNICAL SKILLS from JOB_TECHNICAL_SKILLS list provided
- Suggest missing programming languages, frameworks, databases, tools
- Focus on concrete technologies the candidate should learn/highlight

MISSING KEYWORDS RULES:
- ONLY include specific technical skills from JOB_TECHNICAL_SKILLS
- EXCLUDE business terms, product features, general descriptions
- Examples: "React", "Python", "AWS", "PostgreSQL" (good)
- Examples: "SaaS product", "AI-driven features", "automated reporting" (bad)
- Max 8 missing keywords, prioritize most important

CONTENT GAP CATEGORIES:
1. Keyword Match: Technical skills from job requirements missing from resume
2. Content Depth: Experience details that need expansion or quantification
3. Relevance: Skills demonstrated but not highlighted for this role
4. Completeness: Missing sections or incomplete information

TONE: Professional, constructive, focused on technical skill enhancement.`;

  const user = `JOB_DESCRIPTION:\n${jobDesc}\n\nJOB_TECHNICAL_SKILLS:\n${jobSkills.join(', ')}\n\nRESUME_CONTEXT:\n${resumeContext}\n\nCURRENT_SUMMARY:\n${currentSummary || "No existing summary"}`;

  try {
    const r = await aiService.chatCompletion([
      { role:"system", content: sys },
      { role:"user", content: user }
    ], {
      model: "gpt-4o-mini",
      temperature: 0.2,
      });

    const result = safeJSON(r.choices?.[0]?.message?.content || '{}');

    return {
      optimizedSummary: result.optimizedSummary || currentSummary,
      jobMatchAnalysis: result.jobMatchAnalysis || null
    };
  } catch (error) {
    console.error('Error optimizing summary and ATS:', error);
    return {
      optimizedSummary: currentSummary,
      jobMatchAnalysis: null
    };
  }
}

// ---- Legacy function kept for compatibility ----
async function optimizeSummary(aiService, resumeContext, jobDesc, currentSummary){
  const result = await optimizeSummaryAndJobMatch(aiService, resumeContext, jobDesc, currentSummary, null, []);
  return result.optimizedSummary;
}

async function coreHandler(req, res){
  const startTime = Date.now();
  console.time('Total Generation Time');

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
        // We need at least 2 credits remaining since we consume 2 (CV + cover letter)
        if (!trialCheck.allowed || trialCheck.remaining < 2) {
          console.log('Trial limit exceeded');
          const messageText = trialCheck.remaining === 0 
            ? `You've used both of your free trial credits. Sign up for unlimited access!`
            : `Trial generates both CV and cover letter together, requiring 2 credits. You have ${trialCheck.remaining} remaining but need 2. Sign up for unlimited access!`;
          
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
    
    // Job description validation - skip for ATS mode since it focuses on formatting, not content matching
    if (userGoal !== 'ats') {
      // More lenient job description validation for trial users (10 chars vs 30 for authenticated users)
      const minJobDescLength = isTrialUser ? 10 : 30;
      if (!jobDesc || jobDesc.trim().length < minJobDescLength) {
        return res.status(400).json({
          error: `Job description too short (minimum ${minJobDescLength} characters)`,
          code:"E_BAD_INPUT"
        });
      }
    }

    // Using centralized AI service (Grok with OpenAI fallback)

    // OPTIMIZED: Combined skills processing (6 calls → 1 call) - start in parallel
    console.time('Skills Processing');
    const skillsPromise = processAllSkills(
      aiService,
      resumeData,
      resumeText,
      resumeData?.projects || [],
      jobDesc
    );

    const skillsResult = await skillsPromise;
    console.timeEnd('Skills Processing');

    // Process results from combined call
    const allowedSkillsBase = [...new Set([
      ...skillsResult.resumeSkills,
      ...skillsResult.projectSkills,
      ...skillsResult.consolidatedSkills
    ])];

    // CRITICAL: Remove any skills that came from job description
    const jobSkillsSet = new Set(skillsResult.jobSkills.map(s => String(s).toLowerCase()));
    const resumeOnlySkills = allowedSkillsBase.filter(skill =>
      !jobSkillsSet.has(String(skill).toLowerCase())
    );

    const allowedSkills = skillsResult.expandedSkills.length > 0
      ? skillsResult.expandedSkills.filter(skill => !jobSkillsSet.has(String(skill).toLowerCase()))
      : resumeOnlySkills;

    const expanded = new Set(allowedSkills.map(s => String(s).toLowerCase()));
    const allowedSkillsCSV = allowedSkills.join(", ");

    // Job-only skills for learning suggestions
    const jobOnlySkills = skillsResult.jobSkills.filter(s => !expanded.has(String(s).toLowerCase()));
    const jobOnlySkillsCSV = jobOnlySkills.join(", ");

    // Pass 3: generate with hard constraints
    const coverLetterNeeded = userGoal === 'cover-letter' || userGoal === 'both';
    const resumeNeeded = userGoal === 'cv' || userGoal === 'both' || userGoal === 'ats';
    
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
- Standard headers: Experience, Projects, Education, Skills
- 🔧 PROJECTS: Include ALL project data (name, description, dates, bullets). CRITICAL: Extract ALL technologies mentioned in project bullets and automatically add them to the skills section
- For JOB_ONLY skills (${jobOnlySkillsCSV}): Don't mention unless explicitly in original
- LANGUAGE: Use ${langTerms.spelling} with ${langTerms.tone}`.trim();

    } else if (userGoal === 'cover-letter') {
      // Cover letter-only prompt (65% shorter, focused)
      system = `You are a cover letter writer. Output ONLY JSON: { "coverLetterText": "..." }

🎯 Write ${tone} cover letter (250-400 words) using only original ${langTerms.resume} info.

📝 RULES:
- 4 paragraphs: Hook → Value → Fit → Close
- Only skills from: ${allowedSkillsCSV}
- 🔧 PROJECTS: MUST reference specific relevant projects from resume to demonstrate skills, technologies used, and practical experience when applicable to the role
- 🚨 ABSOLUTE TRUTHFULNESS: NEVER fabricate experience, achievements, skills, or qualifications not explicitly in ${langTerms.resume}
- 🚨 NO INFLATION: Don't upgrade job titles, responsibilities, or seniority levels
- 🚨 NO METRICS: Don't add statistics, percentages, or quantified results not in original
- 🚨 NO ASSUMPTIONS: Don't assume company size, industry impact, or team dynamics
- 🚨 VERIFICATION: Every claim must be traceable to original resume content
- For JOB_ONLY (${jobOnlySkillsCSV}): "eager to learn X"
- Tone: ${tone}
- LANGUAGE: Use ${langTerms.spelling} with ${langTerms.tone}`.trim();

    } else if (userGoal === 'ats') {
      // Debug logging for ATS generation
      console.log('🎯 ATS Mode - Resume Data Structure:', JSON.stringify(resumeData, null, 2));
      console.log('🎯 ATS Mode - Resume Text:', resumeText ? resumeText.substring(0, 200) + '...' : 'No resume text');

      // ATS-optimized resume prompt (focused on formatting and structure optimization)
      system = `You are an ATS formatting expert. Output ONLY JSON: { "resumeData": {...} }

🎯 Create ATS-OPTIMIZED ${langTerms.resume} with perfect formatting and structure for Applicant Tracking Systems.

📋 ATS FORMATTING RULES:
- 🎯 FORMATTING: Perfect ATS formatting - consistent fonts, spacing, standard bullet points
- 🔧 STRUCTURE: Use standard section headers exactly: "PROFESSIONAL SUMMARY", "CORE COMPETENCIES", "PROFESSIONAL EXPERIENCE", "EDUCATION", "PROJECTS"
- 📝 TEXT FORMAT: Clean, simple text with consistent formatting throughout all sections
- 📍 DATES: Format all dates consistently (e.g., "Jan 2020 - Dec 2022" or "2020 - 2022")
- 🔸 BULLETS: Use standard bullet points (•) consistently across all experience entries
- 📄 LAYOUT: Single-column, simple structure with clear section separation
- Skills: Include skills from original resume: ${allowedSkillsCSV}
- Power verbs optimized for ATS scanning: ${langTerms.verbs}
- 3-5 professional bullets per role using original responsibilities
- ⚠️ ENHANCE WHILE PRESERVING TRUTH:
  * Keep ALL actual job titles, companies, and roles exactly as provided
  * ENHANCE poor writing into professional, impactful language
  * Transform weak bullets into strong, action-oriented descriptions
  * Improve vague responsibilities into specific, clear achievements
  * Fix grammar, structure, and professional presentation
  * NEVER fabricate or change the nature of any experience
  * NEVER add responsibilities, duties, or achievements not implied by original content
  * Maintain the ACTUAL experience and background of the candidate
- 🔧 PROJECTS: Include ALL project data exactly as provided
- ATS-FRIENDLY: Use standard professional terminology
- LANGUAGE: Use ${langTerms.spelling} with professional tone
- FOCUS: Perfect ATS formatting while maintaining 100% accuracy to original experience

🚨 CRITICAL EXAMPLES:
✅ GOOD: "Fixed bugs" → "Diagnosed and resolved software defects to improve system reliability"
✅ GOOD: "Worked on projects" → "Developed and implemented software solutions using React and Node.js"
❌ BAD: "Software Engineer" → "Customer Service Representative"
❌ BAD: Adding fake customer service experience to technical roles
❌ BAD: Changing the fundamental nature of any job role

FOCUS: Perfect ATS formatting + enhanced professional language while keeping all experience truthful.`.trim();

    } else {
      // Both - streamlined comprehensive prompt (40% shorter)
      system = `You are a professional ${langTerms.resume} & cover letter writer. Output ONLY JSON: { "resumeData": {...}, "coverLetterText": "..." }

🎯 Create ATS ${langTerms.resume} + ${tone} cover letter from original ${langTerms.resume} only.

📋 ${langTerms.resume.toUpperCase()}: Power verbs (${langTerms.verbs}), 3-5 bullets/role, standard headers (Experience, Projects, Education, Skills)
📝 COVER LETTER: 4 paragraphs, 250-400 words, ${tone} tone. MUST reference specific relevant projects to demonstrate skills and experience
⚠️ SKILLS: Only use ${allowedSkillsCSV}
🔧 PROJECTS: Include ALL project data (name, description, dates, bullets). NEVER add technologies to skills that aren't already in the allowed skills list
⚠️ JOB_ONLY (${jobOnlySkillsCSV}): Express learning interest only
🚨 ZERO FABRICATION TOLERANCE:
- NEVER add metrics, statistics, percentages, or quantified results not in original
- NEVER fabricate achievements, accomplishments, or business impact not stated
- NEVER inflate job titles, responsibilities, or seniority levels
- NEVER add skills, technologies, or certifications not demonstrated in original resume
- NEVER add skills from job description that aren't in original resume
- NEVER assume company scale, team sizes, or organizational structure
- NEVER add experience years, industry tenure, or domain expertise not mentioned
- Every single claim must be 100% verifiable against original resume content
- SKILLS SECTION: Must contain ONLY technologies explicitly mentioned in original resume
⚠️ LANGUAGE: Use ${langTerms.spelling} with ${langTerms.tone}`.trim();
    }

    const resumePayload = resumeData ? JSON.stringify(resumeData) : resumeText;
    const userPromptParts = [`Generate JSON${coverLetterNeeded && resumeNeeded ? ' for a tailored cover letter and a revised resume (ATS-friendly)' : coverLetterNeeded ? ' for a tailored cover letter' : userGoal === 'ats' ? ' for an ATS-optimized resume with perfect formatting' : ' for a revised resume (ATS-friendly)'}.`];

    if (coverLetterNeeded) {
      userPromptParts.push(`Cover Letter Tone:\n${tone}`);
    }

    // Only include job description for non-ATS modes
    if (userGoal !== 'ats') {
      userPromptParts.push(`Job Description:\n${jobDesc}`);
    }

    userPromptParts.push(`Resume Data:\n${resumePayload}`);
    
    if (coverLetterNeeded && coverText) {
      userPromptParts.push(`Previous Cover Letter (optional):\n${coverText}`);
    }
    
    const user = userPromptParts.join('\n\n');

    // PARALLEL OPTIMIZATION: Start main generation call with speed optimizations
    console.time('Main Generation');
    const generationPromise = aiService.chatCompletion([
      { role:"system", content: system },
      { role:"user", content: user }
    ], {
      model: "gpt-4o-mini",
      temperature: 0.1, // Reduced temperature for more factual, less creative output
      // Speed optimizations
      max_tokens: userGoal === 'cv' ? 2000 : userGoal === 'cover-letter' ? 800 : userGoal === 'ats' ? 2500 : 3000,
      top_p: 0.9, // Reduce response variability for faster processing
      frequency_penalty: 0, // Disable for speed
      presence_penalty: 0 // Disable for speed
    });

    const resp = await generationPromise;
    console.timeEnd('Main Generation');

    const raw = resp.choices?.[0]?.message?.content || "";

    // Debug logging for ATS mode
    if (userGoal === 'ats') {
      console.log('🎯 ATS Mode - Raw AI Response:', raw.substring(0, 500) + '...');
    }

    const json = safeJSON(raw);
    if (!json) return res.status(502).json({ error:"Bad model output", code:"E_BAD_MODEL_OUTPUT", raw });

    // Debug logging for ATS mode
    if (userGoal === 'ats') {
      console.log('🎯 ATS Mode - Parsed JSON resumeData:', JSON.stringify(json.resumeData, null, 2));
    }

    // Normalize + optimize with best practices
    let rd = null;
    let jobMatchAnalysisResult = null; // Declare in outer scope

    if (resumeNeeded) {
      const allowed = new Set(allowedSkills);
      rd = normalizeResumeData(json.resumeData || {});

      // Filter skills and ensure consolidated skills are preserved
      const filteredSkills = (rd.skills || []).filter(s => allowed.has(String(s).toLowerCase()));

      // Add consolidated base skills that might not be in the expanded set
      const consolidatedSet = new Set(filteredSkills.map(s => String(s).toLowerCase()));
      resumeOnlySkills.forEach(skill => {
        const skillStr = String(skill).toLowerCase();
        if (!consolidatedSet.has(skillStr)) {
          filteredSkills.push(skill);
          consolidatedSet.add(skillStr);
        }
      });

      rd.skills = filteredSkills;

      const resumeContext = resumeData ? JSON.stringify(resumeData) : resumeText;

      // OPTIMIZED: Batch all bullet optimization in single call (3+ calls → 1 call)
      const allBulletsToOptimize = [];
      const bulletMapping = [];

      // Collect all bullets from all sections
      (rd.experience || []).forEach((exp, expIndex) => {
        (exp.bullets || []).forEach((bullet, bulletIndex) => {
          allBulletsToOptimize.push(bullet);
          bulletMapping.push({ section: 'experience', sectionIndex: expIndex, bulletIndex });
        });
      });

      (rd.projects || []).forEach((project, projIndex) => {
        (project.bullets || []).forEach((bullet, bulletIndex) => {
          allBulletsToOptimize.push(bullet);
          bulletMapping.push({ section: 'projects', sectionIndex: projIndex, bulletIndex });
        });
      });

      (rd.education || []).forEach((edu, eduIndex) => {
        (edu.bullets || []).forEach((bullet, bulletIndex) => {
          allBulletsToOptimize.push(bullet);
          bulletMapping.push({ section: 'education', sectionIndex: eduIndex, bulletIndex });
        });
      });

      // PARALLEL OPTIMIZATION: Run bullet optimization and summary+ATS in parallel
      console.time('Parallel Post-Processing');
      const promises = [];

      // Start bullet optimization if needed
      let bulletsPromise = null;
      if (allBulletsToOptimize.length > 0) {
        bulletsPromise = rewriteBullets(aiService, jobDesc, resumeContext, allBulletsToOptimize);
        promises.push(bulletsPromise);
      }

      // Start summary+ATS optimization in parallel
      const summaryPromise = optimizeSummaryAndJobMatch(aiService, resumeContext, jobDesc, rd.summary, rd, skillsResult.jobSkills);
      promises.push(summaryPromise);

      // Wait for both to complete
      const [optimizedBullets, summaryAndATS] = await Promise.all([
        bulletsPromise,
        summaryPromise
      ]);

      // Map optimized bullets back to their sections if we had bullets
      if (optimizedBullets && allBulletsToOptimize.length > 0) {
        optimizedBullets.forEach((optimizedBullet, index) => {
          const mapping = bulletMapping[index];
          if (mapping) {
            if (mapping.section === 'experience') {
              rd.experience[mapping.sectionIndex].bullets[mapping.bulletIndex] = optimizedBullet;
            } else if (mapping.section === 'projects') {
              rd.projects[mapping.sectionIndex].bullets[mapping.bulletIndex] = optimizedBullet;
            } else if (mapping.section === 'education') {
              rd.education[mapping.sectionIndex].bullets[mapping.bulletIndex] = optimizedBullet;
            }
          }
        });
      }

      // Apply summary and ATS results
      rd.summary = summaryAndATS.optimizedSummary;
      jobMatchAnalysisResult = summaryAndATS.jobMatchAnalysis;
      console.timeEnd('Parallel Post-Processing');
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

      // Add ATS compatibility analysis for ATS mode
      if (userGoal === 'ats') {
        const atsCompatibility = await analyzeATSCompatibility(rd, 'ats', jobDesc, aiService);
        if (atsCompatibility) {
          payload.atsAnalysis = atsCompatibility;
          console.log('ATS compatibility analysis completed:', atsCompatibility.overallScore);
        }
      }

      // Use combined job match analysis result (already computed above)
      if (jobMatchAnalysisResult && jobDesc && jobDesc.trim().length > 50) {
        payload.jobMatchAnalysis = jobMatchAnalysisResult;
        console.log('Job match analysis completed:', jobMatchAnalysisResult.overallScore);
      }
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

    // Performance monitoring
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    console.timeEnd('Total Generation Time');
    console.log(`✅ Generation completed in ${totalTime}ms | Goal: ${userGoal || 'unknown'}`);

    return res.status(200).json(payload);
  }catch(err){
    console.error(err);
    console.timeEnd('Total Generation Time');
    return res.status(500).json({ error:"Server error", detail:String(err?.message || err) });
  }
}

export default withLimiter(coreHandler, { limit: 10, windowMs: 60_000 });

