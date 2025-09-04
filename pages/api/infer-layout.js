import fs from "fs";
import os from "os";
import formidable from "formidable";
import { PdfReader } from "pdfreader";

export const config = { api: { bodyParser: false } };

function parseForm(req){
  const form = formidable({ multiples:false, uploadDir: os.tmpdir(), keepExtensions:true, maxFileSize: 20*1024*1024 });
  return new Promise((resolve,reject)=>form.parse(req,(err,fields,files)=>err?reject(err):resolve({fields,files})));
}

// crude two-column detection: two strong x-clusters on page 1
async function detectTwoCol(pdfPath){
  const xs = [];
  const reader = new PdfReader();
  await new Promise((resolve,reject)=>{
    reader.parseFileItems(pdfPath, (err, item)=>{
      if (err) return reject(err);
      if (!item) return resolve(); // end
      if (item.page && item.page > 1) return resolve(); // first page only
      if (item.text && typeof item.x === "number") xs.push(item.x);
    });
  });
  if (xs.length < 40) return false;
  xs.sort((a,b)=>a-b);
  const bins = new Map();
  xs.forEach(x=>{
    const k = Math.round(x/40)*40; // bin width ~40
    bins.set(k, (bins.get(k)||0)+1);
  });
  const sorted = Array.from(bins.entries()).sort((a,b)=>b[1]-a[1]).slice(0,2);
  if (sorted.length < 2) return false;
  const [x1,c1] = sorted[0], [x2,c2] = sorted[1];
  return (Math.abs(x1-x2) > 150) && c1>15 && c2>15;
}

export default async function handler(req,res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  try{
    const { files } = await parseForm(req);
    const f = files?.resume || files?.file;
    const one = Array.isArray(f) ? f[0] : f;
    if (!one || !one.filepath) return res.status(400).json({ error:"No file" });
    const isTwo = await detectTwoCol(one.filepath);
    return res.status(200).json({ template: isTwo ? "twoCol" : "classic" });
  }catch(e){
    return res.status(500).json({ error:"Inference failed", detail:String(e?.message||e) });
  }
}
