import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkCreditAvailability, consumeCredit, trackApiUsage } from '../../lib/credit-purchase-system';
import { withLimiter } from '../../lib/ratelimit';
import aiService from '../../lib/ai-service';

export default withLimiter(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  // Require authentication for ATS analysis (premium feature)
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required for ATS analysis' });
  }

  const userId = session.user.id;
  const { resumeData, jobDescription } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: 'Resume data is required' });
  }

  // ATS analysis focuses on general formatting optimization, not job matching
  if (!jobDescription) {
    jobDescription = "";
  }

  try {
    // Check if user has access to ATS analysis (premium feature)
    const creditCheck = await checkCreditAvailability(userId, 'ats_analysis');
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'ATS Analysis not available',
        message: creditCheck.message,
        credits: creditCheck.credits,
        plan: creditCheck.plan,
        requiresUpgrade: true
      });
    }

    // Prepare resume text for analysis
    const resumeText = formatResumeForAnalysis(resumeData);
    console.log('ATS API - Resume data structure:', JSON.stringify(resumeData, null, 2));
    console.log('ATS API - Formatted resume text:', resumeText);

    // Generate ATS compatibility analysis using AI
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
          content: `Please analyze this resume for ATS (Applicant Tracking System) compatibility and general optimization.

RESUME CONTENT:
${resumeText}

Focus specifically on GENERAL ATS OPTIMIZATION:
1. Assess overall ATS formatting and structure compatibility
2. Evaluate professional summary strength and keyword density
3. Review experience descriptions for ATS-friendly language
4. Check skills section for relevant technical keywords
5. Analyze section headers and formatting for ATS parsing
6. Identify opportunities to strengthen professional language

IMPORTANT ANALYSIS RULES:
- Focus on general ATS best practices and professional presentation
- Prioritize formatting, structure, and professional language optimization
- Focus on substantial improvements, not minor wording differences
- Prioritize technical skills, certifications, and specific qualifications over common terms
- The resume already uses proper ATS formatting - focus on meaningful content improvements only

Provide realistic, high-impact content recommendations that would genuinely improve ATS performance.`
        }
      ], {
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 2000
      });

    const analysisText = analysisResponse.choices[0].message.content;
    let analysis;

    try {
      // Remove any markdown formatting and parse JSON
      const cleanedResponse = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse ATS analysis JSON:', parseError);
      return res.status(500).json({ error: 'Failed to generate ATS analysis' });
    }

    // Validate analysis structure
    if (!analysis.overallScore || !analysis.categories) {
      console.error('Invalid ATS analysis structure:', analysis);
      return res.status(500).json({ error: 'Invalid ATS analysis format' });
    }

    // Consume credit for ATS analysis
    await consumeCredit(userId, 'ats_analysis');
    await trackApiUsage(userId, 'ats_analysis');

    // Return the analysis
    res.status(200).json({
      success: true,
      analysis: {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        jobDescriptionLength: jobDescription.length,
        resumeLength: resumeText.length
      }
    });

  } catch (error) {
    console.error('ATS analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze resume for ATS compatibility' });
  }
});

function formatResumeForAnalysis(resumeData) {
  let text = '';

  // Handle both direct and nested data structures
  const data = resumeData.resumeData || resumeData;

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