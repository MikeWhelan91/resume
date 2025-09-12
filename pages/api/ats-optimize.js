import OpenAI from 'openai';
import { normalizeResumeData } from '../../lib/normalizeResume';
import { getServerSession } from 'next-auth/next';
import NextAuth from './auth/[...nextauth]';
import { checkCreditAvailability, getUserEntitlementWithCredits, getEffectivePlan } from '../../lib/credit-system';

// JSON helpers
function stripCodeFence(s = "") {
  const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : s;
}

function safeJSON(s) { 
  try { 
    return JSON.parse(stripCodeFence(s)); 
  } catch { 
    return null; 
  } 
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userData, jobDescription } = req.body;

  if (!userData) {
    return res.status(400).json({ error: 'User data is required' });
  }

  // Check user authentication and plan
  let userId = null;
  let userPlan = 'free';
  
  try {
    const session = await getServerSession(req, res, NextAuth);
    if (session?.user?.id) {
      userId = session.user.id;
      
      // Get user entitlement to check plan
      const entitlement = await getUserEntitlementWithCredits(userId);
      userPlan = getEffectivePlan(entitlement);
    }
  } catch (error) {
    console.error('Error checking user session:', error);
  }

  // ATS optimization is Pro-only
  if (userPlan === 'free') {
    return res.status(403).json({ 
      error: 'Pro feature required', 
      message: 'ATS optimization is only available for Pro users. Please upgrade to access this feature.'
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resumeData = userData.resumeData;

    // Enhanced ATS optimization system prompt
    const system = `
You are an ATS (Applicant Tracking System) optimization expert. Your task is to enhance a resume to be more ATS-friendly while maintaining accuracy and professional quality.

Output ONLY JSON with the same structure as the input, but with these ATS optimizations:
1. Use standard section headings (Experience, Education, Skills, etc.)
2. Include relevant keywords from the job description naturally
3. Use simple, clean formatting without special characters
4. Optimize bullet points with action verbs and quantified results
5. Ensure consistent date formats (MM/YYYY)
6. Remove or replace any problematic characters that ATS systems might struggle with
7. Optimize skills section with both hard and soft skills relevant to the role
8. Ensure contact information follows standard formats

CRITICAL: Do not fabricate information. Only optimize existing content and structure.
Do not add experience, skills, or qualifications that aren't already present.
Focus on reformatting, rewording, and restructuring existing information for better ATS compatibility.
`;

    const resumePayload = JSON.stringify(resumeData);
    const jobDescContext = jobDescription ? `\n\nJob Description Context:\n${jobDescription}` : '';
    
    const user = `
Optimize this resume for ATS systems while maintaining accuracy and professional quality.
Focus on formatting, keyword optimization, and structure improvements.

Resume Data:
${resumePayload}${jobDescContext}
`.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    const raw = response.choices?.[0]?.message?.content || "";
    const json = safeJSON(raw);
    
    if (!json) {
      return res.status(502).json({ 
        error: "Bad model output", 
        code: "E_BAD_MODEL_OUTPUT", 
        raw 
      });
    }

    // Normalize the optimized resume data
    const optimizedResumeData = normalizeResumeData(json);
    
    // Return the optimized data with the same structure as original userData
    const optimizedUserData = {
      ...userData,
      resumeData: optimizedResumeData
    };

    return res.status(200).json(optimizedUserData);

  } catch (error) {
    console.error('ATS optimization error:', error);
    return res.status(500).json({ 
      error: 'Failed to optimize resume for ATS', 
      detail: error.message 
    });
  }
}