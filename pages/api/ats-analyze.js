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
  
  // Require authentication for job match analysis (premium feature)
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required for job match analysis' });
  }

  const userId = session.user.id;
  const { resumeData, jobDescription } = req.body;

  if (!resumeData) {
    return res.status(400).json({ error: 'Resume data is required' });
  }

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required' });
  }

  try {
    // Check if user has access to job match analysis (premium feature)
    const creditCheck = await checkCreditAvailability(userId, 'ats_analysis');
    if (!creditCheck.allowed) {
      return res.status(429).json({
        error: 'Job Match Analysis not available',
        message: creditCheck.message,
        credits: creditCheck.credits,
        plan: creditCheck.plan,
        requiresUpgrade: true
      });
    }

    // Prepare resume text for analysis
    const resumeText = formatResumeForAnalysis(resumeData);

    // Generate job match analysis using AI
    const analysisResponse = await aiService.chatCompletion([
        {
          role: "system",
          content: `You are an expert job matching analyzer. Your task is to analyze a resume against a job description and provide a comprehensive job compatibility assessment focusing on content relevance and keyword optimization.

Return your analysis as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "categories": {
    "keywordMatch": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    },
    "format": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    },
    "structure": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    },
    "relevance": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation>",
      "recommendations": ["<specific actionable recommendations>"]
    }
  },
  "keywordGaps": [
    {
      "keyword": "<missing keyword>",
      "importance": "<high|medium|low>",
      "suggestions": ["<where to add it>"]
    }
  ],
  "strengths": ["<what the resume does well for job matching>"],
  "quickWins": ["<easy improvements for immediate impact>"],
  "industrySpecific": "<industry-specific job matching advice>"
}`
        },
        {
          role: "user",
          content: `Please analyze this resume for job compatibility against the following job description.

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeText}

Focus on:
1. Keyword matching between job description and resume
2. Content relevance and alignment with job requirements
3. Skills alignment and experience matching
4. Missing critical keywords or qualifications
5. Industry-specific optimization opportunities

Provide specific, actionable recommendations for better job matching.`
        }
      ], {
        model: "grok-3",
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
      console.error('Failed to parse job match analysis JSON:', parseError);
      return res.status(500).json({ error: 'Failed to generate job match analysis' });
    }

    // Validate analysis structure
    if (!analysis.overallScore || !analysis.categories) {
      console.error('Invalid job match analysis structure:', analysis);
      return res.status(500).json({ error: 'Invalid job match analysis format' });
    }

    // Consume credit for job match analysis
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
    console.error('Job match analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze resume for job compatibility' });
  }
});

function formatResumeForAnalysis(resumeData) {
  let text = '';
  
  if (resumeData.name) text += `Name: ${resumeData.name}\n`;
  if (resumeData.email) text += `Email: ${resumeData.email}\n`;
  if (resumeData.phone) text += `Phone: ${resumeData.phone}\n`;
  if (resumeData.location) text += `Location: ${resumeData.location}\n`;
  
  if (resumeData.summary) {
    text += `\nPROFESSIONAL SUMMARY:\n${resumeData.summary}\n`;
  }
  
  if (resumeData.experience && resumeData.experience.length > 0) {
    text += '\nWORK EXPERIENCE:\n';
    resumeData.experience.forEach(exp => {
      text += `${exp.title} at ${exp.company} (${exp.duration})\n`;
      if (exp.description) text += `${exp.description}\n`;
      text += '\n';
    });
  }
  
  if (resumeData.skills && resumeData.skills.length > 0) {
    text += `SKILLS:\n${resumeData.skills.join(', ')}\n\n`;
  }
  
  if (resumeData.education && resumeData.education.length > 0) {
    text += 'EDUCATION:\n';
    resumeData.education.forEach(edu => {
      text += `${edu.degree} from ${edu.institution} (${edu.year})\n`;
    });
  }
  
  return text;
}
