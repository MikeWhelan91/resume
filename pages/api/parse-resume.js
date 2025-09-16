import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
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
  const form = formidable({ 
    multiples: false, 
    uploadDir: os.tmpdir(), 
    keepExtensions: true, 
    maxFileSize: 10*1024*1024, // Reduced from 20MB to 10MB for security
    filter: function ({name, originalFilename, mimetype}) {
      // Only allow specific file types
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      const allowedExtensions = ['.pdf', '.docx', '.txt'];
      const ext = originalFilename?.toLowerCase().split('.').pop();
      
      return allowedTypes.includes(mimetype) || allowedExtensions.includes(`.${ext}`);
    }
  });
  return new Promise((resolve,reject)=>form.parse(req,(err,fields,files)=>{
    if (err) {
      // Clean up any uploaded files on error
      if (files) {
        Object.values(files).forEach(file => {
          const f = Array.isArray(file) ? file : [file];
          f.forEach(singleFile => {
            try { fs.unlinkSync(singleFile.filepath || singleFile.path); } catch {}
          });
        });
      }
      reject(err);
    } else {
      resolve({fields,files});
    }
  }));
}

function stripCodeFence(s=""){ const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return m ? m[1] : s; }
function safeJSON(s){ try{ return JSON.parse(stripCodeFence(s)); } catch { return null; } }

export default async function handler(req,res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });
  
  // Check authentication and trial limits
  let userId = null;
  let isTrialUser = false;
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Anonymous trial user - check trial limits
      isTrialUser = true;
      const trialCheck = await checkTrialLimit(req, 'parse');
      if (!trialCheck.allowed) {
        return res.status(429).json({ 
          error: 'Trial parsing limit reached', 
          message: `Trial allows ${trialCheck.limit} resume parses. Sign up for unlimited parsing!`,
          code: 'TRIAL_PARSE_LIMIT'
        });
      }
    }
  } catch (error) {
    console.error('Error checking authentication/trial limits:', error);
    // For security, fail closed if we can't verify permissions
    return res.status(500).json({ error: 'Unable to verify permissions' });
  }
  
  try{
    const { fields, files } = await parseForm(req);
    let resumeText = '';
    if (fields?.text) {
      resumeText = String(fields.text);
    } else {
      resumeText = await extractTextFromFile(files?.resume || files?.file);
    }
    if (!resumeText) return res.status(400).json({ error:"No readable file" });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const system = `Extract as JSON: {"resumeData":{name,title?,email?,phone?,location?,summary?,links[],skills[],experience[],education[],projects[]}}
Experience: company,title,start,end,location?,bullets[]. Education: school,degree,start,end,grade?. Projects: name,description?,start?,end?,present?,url?,demo?,bullets[].`;
    const user = `${resumeText.slice(0, 15000)}`; // Limit input text for faster processing
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role:"system", content: system }, { role:"user", content: user }],
      max_tokens: 2000
    });
    const json = safeJSON(resp.choices?.[0]?.message?.content || "");
    if (!json) return res.status(502).json({ error:"Bad model output" });
    const rd = normalizeResumeData(json.resumeData || json);
    
    // Consume trial usage for anonymous users after successful processing
    if (isTrialUser) {
      try {
        await consumeTrialUsage(req, 'parse');
      } catch (error) {
        console.error('Error tracking trial parse usage:', error);
        // Don't block the response if tracking fails
      }
    }
    
    return res.status(200).json({ resumeData: rd });
  }catch(err){
    console.error('Parse-resume error:', err);
    // Don't expose sensitive error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? String(err?.message || err)
      : 'Processing failed';
    return res.status(500).json({ error: "Server error", detail: errorMessage });
  }
}
