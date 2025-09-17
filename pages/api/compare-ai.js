import aiService from '../../lib/ai-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, testType = 'general', models = ['grok-3-mini', 'grok-code-fast-1'] } = req.body;

  const testPrompt = prompt || getTestPrompt(testType);

  try {
    console.log(`🔬 AI Comparison Test: ${testType}`);

    const startTime = Date.now();
    const results = {};

    // Test specified Grok models
    for (const model of models) {
      console.log(`🤖 Testing ${model}...`);
      const modelStart = Date.now();
      try {
        const grokResult = await aiService.grokCompletion([
          { role: 'user', content: testPrompt }
        ], {
          model: model,
          temperature: 0.3,
          max_tokens: 1000
        });
        results[model] = {
          content: grokResult.choices[0].message.content,
          model: grokResult.model,
          usage: grokResult.usage,
          responseTime: Date.now() - modelStart
        };
        console.log(`✅ ${model} successful`);
      } catch (error) {
        results[model] = { error: error.message };
        console.error(`❌ ${model} failed:`, error.message);
      }
    }

    // Test OpenAI
    console.log('🔄 Testing OpenAI...');
    const openaiStart = Date.now();
    try {
      const openaiResult = await aiService.openaiCompletion([
        { role: 'user', content: testPrompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000
      });
      results.openai = {
        content: openaiResult.choices[0].message.content,
        model: openaiResult.model,
        usage: openaiResult.usage,
        responseTime: Date.now() - openaiStart
      };
      console.log('✅ OpenAI successful');
    } catch (error) {
      results.openai = { error: error.message };
      console.error('❌ OpenAI failed:', error.message);
    }

    const totalTime = Date.now() - startTime;

    // Analysis - find fastest model
    const responseTimes = {};
    const validResults = {};

    Object.keys(results).forEach(key => {
      if (results[key].responseTime) {
        responseTimes[key] = results[key].responseTime;
        validResults[key] = results[key];
      }
    });

    const fastestModel = Object.keys(responseTimes).reduce((a, b) =>
      responseTimes[a] < responseTimes[b] ? a : b,
      Object.keys(responseTimes)[0]
    );

    const analysis = {
      speed: {
        ...responseTimes,
        winner: fastestModel || 'inconclusive'
      },
      tokens: Object.keys(validResults).reduce((acc, key) => {
        acc[key] = validResults[key].usage || 'unavailable';
        return acc;
      }, {}),
      responseLength: Object.keys(results).reduce((acc, key) => {
        acc[key] = results[key].content?.length || 0;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      testType,
      prompt: testPrompt,
      results,
      analysis,
      totalTestTime: totalTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Comparison test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getTestPrompt(testType) {
  const prompts = {
    general: "Explain the difference between machine learning and artificial intelligence in simple terms.",

    resume: `Analyze this resume and provide improvement suggestions:

RESUME:
John Smith
Software Engineer
john@email.com

Experience:
- Frontend Developer at TechCorp (2022-2024)
  • Built React applications
  • Worked with team of 5 developers
  • Fixed bugs and added features

Skills: JavaScript, React, HTML, CSS

Education:
Computer Science Degree, State University (2018-2022)

JOB TARGET:
Senior Full Stack Developer position requiring Node.js, React, and cloud experience.

Provide specific, actionable improvements.`,

    creative: "Write a short, engaging product description for an AI-powered resume builder that helps job seekers get hired faster.",

    technical: "Explain how to implement rate limiting in a Node.js API with Redis, including code examples.",

    json: `Extract key information from this text and return as JSON:

"Sarah Johnson is a Marketing Manager at Digital Solutions Inc. She has 5 years of experience in digital marketing, specializing in SEO and social media campaigns. She holds a Bachelor's in Marketing from Boston University and is certified in Google Analytics and Facebook Ads."

Return JSON with: name, title, company, experience_years, specialties, education, certifications.`
  };

  return prompts[testType] || prompts.general;
}