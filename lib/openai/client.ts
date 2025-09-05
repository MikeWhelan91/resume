import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';
export const openai = new OpenAI({ apiKey });

export const model = process.env.OPENAI_MODEL_TAILOR || 'gpt-4o-mini';
export const temperature = Number(process.env.OPENAI_TEMPERATURE || '0.2');
