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
  let { resumeData, jobDescription } = req.body;

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

Focus specifically on ATS TECHNICAL COMPATIBILITY:
1. Section Header Recognition (can ATS systems find your sections?)
2. Contact Information Parseability (can ATS extract your details?)
3. Work Experience Structure (proper formatting for automated parsing?)
4. Skills Section Optimization (machine-readable keywords?)
5. Overall ATS Readability (will automated systems correctly process this?)

NOTE: This resume uses a professionally designed ATS-optimized template with proper formatting, fonts, and structure. Focus analysis on CONTENT STRUCTURE and ATS PARSING rather than visual design.

Return your analysis as a JSON object with this EXACT structure and field names:
{
  "overallScore": <MUST BE EXACT AVERAGE: (sectionHeaders + contactInfo + experienceStructure + skillsOptimization) divided by 4>,
  "categories": {
    "sectionHeaders": {
      "score": <number 0-100>,
      "analysis": "<List exactly which headers are PRESENT and which are MISSING. Example: 'Found: PROJECTS header. Missing: PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, SKILLS, EDUCATION headers.'>",
      "recommendations": ["<specific header to add, like 'Add PROFESSIONAL EXPERIENCE header before job listings'>"]
    },
    "contactInfo": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation of contact info parseability>",
      "recommendations": ["<specific improvements needed>"]
    },
    "experienceStructure": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation of job formatting>",
      "recommendations": ["<specific formatting improvements>"]
    },
    "skillsOptimization": {
      "score": <number 0-100>,
      "analysis": "<detailed explanation - if NO skills section exists, say so>",
      "recommendations": ["<specific actions to improve skills section>"]
    }
  },
  "keywordGaps": [
    {
      "keyword": "<missing important keyword>",
      "importance": "<high|medium|low>",
      "suggestions": ["<where and how to add it>"]
    }
  ],
  "issues": ["<List ALL major ATS problems: missing headers, missing sections, formatting issues>"],
  "quickWins": ["<ALL immediate fixes: add missing headers, create missing sections>"],
  "strengths": ["<what works well for ATS systems>"]
}`
        },
        {
          role: "user",
          content: `Analyze this resume for ATS (Applicant Tracking System) compatibility. Give ACCURATE scores based on what actually exists in the CV.

RESUME CONTENT:
${resumeText}

SCORING RULES - CHECK THESE SPECIFIC THINGS:

1. Section Headers (0-100) - CHECK FOR ACTUAL HEADERS:
   Look for these exact patterns in the text:
   - "PROFESSIONAL SUMMARY" or "SUMMARY" as standalone headers
   - "PROFESSIONAL EXPERIENCE" or "WORK EXPERIENCE" as standalone headers
   - "SKILLS" or "CORE COMPETENCIES" as standalone headers
   - "EDUCATION" as standalone header

   SCORE:
   - 100 = All 4 major headers present
   - 75 = 3 headers present
   - 50 = 2 headers present
   - 25 = 1 header present
   - 0 = No proper section headers

2. Contact Info (0-100):
   - 100 = Name, email, phone clearly visible
   - 0 = Missing critical contact info

3. Experience Structure (0-100):
   - Does work experience have a proper "PROFESSIONAL EXPERIENCE" header? If NO, deduct 30 points
   - Are jobs well-formatted? Score remaining 70 points based on structure

4. Skills Section (0-100):
   - 0 = NO SKILLS SECTION EXISTS AT ALL
   - 50 = Skills mentioned in text but no dedicated section
   - 100 = Proper "SKILLS" section with clear header

CRITICAL ANALYSIS RULES:
- If content exists but section header is MISSING, this is a major ATS problem
- Missing entire sections (education, skills) should be flagged as high-priority issues
- Experience without "PROFESSIONAL EXPERIENCE" header scores lower than 100
- Overall score should reflect the AVERAGE of the 4 category scores
- Calculate overall score as: (sectionHeaders + contactInfo + experienceStructure + skillsOptimization) / 4`
        }
      ], {
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 2000
      });

    const analysisText = analysisResponse.choices[0].message.content;
    console.log('🔍 Raw AI Analysis Response:', analysisText);
    let analysis;

    try {
      // Remove any markdown formatting and parse JSON
      const cleanedResponse = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('🔍 Cleaned Response for Parsing:', cleanedResponse);
      analysis = JSON.parse(cleanedResponse);
      console.log('🔍 Parsed Analysis Structure:', JSON.stringify(analysis, null, 2));

      // POST-PROCESSING: Verify and correct AI analysis against actual text
      analysis = verifyAndCorrectAnalysis(analysis, resumeText);
      console.log('🔍 Corrected Analysis:', JSON.stringify(analysis, null, 2));

    } catch (parseError) {
      console.error('Failed to parse ATS analysis JSON:', parseError);
      console.error('Raw response that failed to parse:', analysisText);
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

function verifyAndCorrectAnalysis(analysis, resumeText) {
  console.log('🔍 VERIFICATION: Starting post-processing verification...');
  console.log('🔍 VERIFICATION: Resume text to check:', resumeText.substring(0, 500) + '...');

  // Check for actual section headers in the text (handle colons and flexible patterns)
  const headerChecks = {
    summary: /^\s*(PROFESSIONAL SUMMARY|SUMMARY)\s*:?\s*$/mi.test(resumeText),
    experience: /^\s*(PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE)\s*:?\s*$/mi.test(resumeText),
    skills: /^\s*(SKILLS|CORE COMPETENCIES|TECHNICAL SKILLS)\s*:?\s*$/mi.test(resumeText),
    education: /^\s*(EDUCATION)\s*:?\s*$/mi.test(resumeText)
  };

  // Also log individual header searches for debugging
  console.log('🔍 VERIFICATION: Individual header tests:');
  console.log('  - Summary:', /^\s*(PROFESSIONAL SUMMARY|SUMMARY)\s*:?\s*$/mi.test(resumeText));
  console.log('  - Experience:', /^\s*(PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE)\s*:?\s*$/mi.test(resumeText));
  console.log('  - Skills:', /^\s*(SKILLS|CORE COMPETENCIES|TECHNICAL SKILLS)\s*:?\s*$/mi.test(resumeText));
  console.log('  - Education:', /^\s*(EDUCATION)\s*:?\s*$/mi.test(resumeText));

  console.log('🔍 VERIFICATION: Header detection results:', headerChecks);

  // Count actual headers present
  const actualHeaderCount = Object.values(headerChecks).filter(Boolean).length;
  console.log('🔍 VERIFICATION: Actual headers found:', actualHeaderCount);

  // Correct section headers score if AI was wrong
  const correctSectionHeaderScore = actualHeaderCount === 4 ? 100 :
                                  actualHeaderCount === 3 ? 75 :
                                  actualHeaderCount === 2 ? 50 :
                                  actualHeaderCount === 1 ? 25 : 0;

  // Always override AI's section headers analysis with our verification
  if (analysis.categories?.sectionHeaders) {
    const aiHeaderScore = analysis.categories.sectionHeaders.score;
    console.log(`🔍 VERIFICATION: AI gave section headers score ${aiHeaderScore}, our calculation gives ${correctSectionHeaderScore}`);

    // Always use our calculation regardless of what AI said
    analysis.categories.sectionHeaders.score = correctSectionHeaderScore;

    // Update analysis text to reflect reality
    const foundHeaders = Object.entries(headerChecks)
      .filter(([key, found]) => found)
      .map(([key]) => key.toUpperCase())
      .join(', ');

    const missingHeaders = Object.entries(headerChecks)
      .filter(([key, found]) => !found)
      .map(([key]) => key.toUpperCase())
      .join(', ');

    analysis.categories.sectionHeaders.analysis = foundHeaders
      ? `Found: ${foundHeaders} headers. ${missingHeaders ? `Missing: ${missingHeaders} headers.` : 'All major headers present.'}`
      : 'No proper section headers found.';

    // Update recommendations based on what's actually missing
    analysis.categories.sectionHeaders.recommendations = missingHeaders
      ? missingHeaders.split(', ').map(header => `Add ${header} header to improve ATS parsing`)
      : [];

    console.log(`🔍 VERIFICATION: Updated section headers score from ${aiHeaderScore} to ${correctSectionHeaderScore}`);
  }

  // Correct experience structure score if professional experience header exists
  if (analysis.categories?.experienceStructure && headerChecks.experience) {
    const aiExpScore = analysis.categories.experienceStructure.score;
    if (aiExpScore < 100) {
      console.log(`🔍 VERIFICATION: PROFESSIONAL EXPERIENCE header found, correcting experience score from ${aiExpScore} to 100`);
      analysis.categories.experienceStructure.score = 100;
      analysis.categories.experienceStructure.analysis = 'Work experience has proper "PROFESSIONAL EXPERIENCE" header and is well-formatted for ATS parsing.';

      // Remove the professional experience header recommendation from issues/quickWins
      if (analysis.issues) {
        analysis.issues = analysis.issues.filter(issue =>
          !(issue.toLowerCase().includes('professional experience') && issue.toLowerCase().includes('header'))
        );
      }
      if (analysis.quickWins) {
        analysis.quickWins = analysis.quickWins.filter(win =>
          !(win.toLowerCase().includes('professional experience') && win.toLowerCase().includes('header'))
        );
      }
      if (analysis.categories.experienceStructure.recommendations) {
        analysis.categories.experienceStructure.recommendations =
          analysis.categories.experienceStructure.recommendations.filter(rec =>
            !rec.toLowerCase().includes('professional experience') ||
            !rec.toLowerCase().includes('header')
          );
      }
    }
  }

  // Recalculate overall score with corrected values
  if (analysis.categories) {
    const categoryScores = Object.values(analysis.categories).map(cat => cat.score);
    const correctOverallScore = Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length);

    console.log(`🔍 VERIFICATION: Recalculated overall score: ${correctOverallScore} (was ${analysis.overallScore})`);
    analysis.overallScore = correctOverallScore;
  }

  console.log('🔍 VERIFICATION: Post-processing complete');
  return analysis;
}

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