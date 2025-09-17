import OpenAI from 'openai';

class AIService {
  constructor() {
    // Initialize OpenAI client (fallback)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Grok API configuration
    this.grokApiKey = process.env.GROK_API_KEY;
    this.grokBaseUrl = 'https://api.x.ai/v1';
  }

  async chatCompletion(messages, options = {}) {
    const {
      model = 'gpt-4o-mini',
      temperature = 0.3,
      max_tokens = 4000,
      stream = false
    } = options;

    // Try OpenAI first (much faster for your use case)
    try {
      console.log('🚀 Using OpenAI (primary)...');
      const response = await this.openaiCompletion(messages, {
        model: model.includes('grok') ? 'gpt-4o-mini' : model,
        temperature,
        max_tokens,
        stream
      });
      console.log('✅ OpenAI call successful');
      return response;
    } catch (error) {
      console.warn('⚠️ OpenAI failed, falling back to Grok:', error.message);
    }

    // Fallback to Grok if OpenAI fails
    if (this.grokApiKey) {
      try {
        console.log('🔄 Using Grok fallback...');
        const response = await this.grokCompletion(messages, {
          model: 'grok-3-mini',
          temperature,
          max_tokens,
          stream
        });
        console.log('✅ Grok fallback successful');
        return response;
      } catch (error) {
        console.error('❌ Both OpenAI and Grok failed:', error);
        throw new Error(`AI service unavailable: ${error.message}`);
      }
    } else {
      throw new Error('AI service unavailable: OpenAI failed and no Grok key configured');
    }
  }

  async grokCompletion(messages, options) {
    const requestBody = {
      messages,
      model: options.model || 'grok-3-mini',
      stream: options.stream || false,
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 4000
    };

    const response = await fetch(`${this.grokBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.grokApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Transform Grok response to match OpenAI format
    return {
      choices: [{
        message: {
          content: data.choices[0].message.content,
          role: data.choices[0].message.role
        },
        finish_reason: data.choices[0].finish_reason
      }],
      usage: data.usage,
      model: data.model
    };
  }

  async openaiCompletion(messages, options) {
    return await this.openai.chat.completions.create({
      messages,
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 4000,
      stream: options.stream || false
    });
  }

  // Health check method
  async healthCheck() {
    const results = {
      grok: false,
      openai: false,
      timestamp: new Date().toISOString()
    };

    // Test Grok
    if (this.grokApiKey) {
      try {
        await this.grokCompletion([{ role: 'user', content: 'Test' }], { max_tokens: 10 });
        results.grok = true;
      } catch (error) {
        console.warn('Grok health check failed:', error.message);
      }
    }

    // Test OpenAI
    try {
      await this.openaiCompletion([{ role: 'user', content: 'Test' }], { max_tokens: 10 });
      results.openai = true;
    } catch (error) {
      console.warn('OpenAI health check failed:', error.message);
    }

    return results;
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;