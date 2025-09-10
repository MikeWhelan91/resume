import os from "os";
import fs from "fs";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { normalizeResumeData } from "../../lib/normalizeResume";

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
  const form = formidable({ multiples:false, uploadDir: os.tmpdir(), keepExtensions:true, maxFileSize: 20*1024*1024 });
  return new Promise((resolve,reject)=>form.parse(req,(err,fields,files)=>err?reject(err):resolve({fields,files})));
}

function stripCodeFence(s=""){ const m = String(s).trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return m ? m[1] : s; }
function safeJSON(s){ try{ return JSON.parse(stripCodeFence(s)); } catch { return null; } }

export default async function handler(req,res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error:"Missing OPENAI_API_KEY" });
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
    const system = `Output ONLY JSON: {"resumeData":{name,title?,email?,phone?,location?,summary?,links[],skills[],experience[],education[]}}
Experience items must include company, title, start, end, location?, bullets[].
Education items must include school, degree, start, end, grade?.
Use ONLY details present in RESUME_TEXT. Do not fabricate.`;
    const user = `RESUME_TEXT:\n${resumeText}`;
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role:"system", content: system }, { role:"user", content: user }]
    });
    const json = safeJSON(resp.choices?.[0]?.message?.content || "");
    if (!json) return res.status(502).json({ error:"Bad model output" });
    const rd = normalizeResumeData(json.resumeData || json);
    return res.status(200).json({ resumeData: rd });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error:"Server error", detail:String(err?.message||err) });
  }
}
