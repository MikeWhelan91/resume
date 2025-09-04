const STOP = new Set([
  "and","with","for","the","a","an","to","of","in","on","at","as","is","are","be","or",
  "team","skills","experience","engineer","developer","junior","senior","manager",
  "hybrid","remote","full-time","part-time","contract","about","profile","summary"
]);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function extractTokens(text = "") {
  const t = String(text);

  // Special tokens that often include punctuation (C#, C++, .NET, Node.js, Next.js, EMR names, etc.)
  const specials = [
    /C\+\+/gi, /C#/gi, /\.NET(?: Core)?/gi, /Node\.js/gi, /Next\.js/gi,
    /React(?:\.js)?/gi, /Vue(?:\.js)?/gi, /Angular/gi,
    /TypeScript/gi, /JavaScript/gi, /\bSQL\b/gi,
    /PostgreSQL/gi, /MySQL/gi, /MongoDB/gi,
    /\bAWS\b/gi, /\bGCP\b/gi, /\bAzure\b/gi,
    /Docker/gi, /Kubernetes/gi, /Terraform/gi, /Linux/gi,
    // Non-tech examples commonly seen across domains:
    /QuickBooks/gi, /AutoCAD/gi, /SolidWorks/gi, /Photoshop/gi, /Illustrator/gi,
    /Salesforce/gi, /HubSpot/gi, /SAP/gi, /Oracle/gi,
    /Epic EMR/gi, /Cerner/gi, /Meditech/gi,
    /HACCP/gi, /OSHA ?\d{2}/gi, /ISO ?\d{3,5}/gi, /PMP/gi, /CNA/gi, /CPA/gi
  ];
  const out = new Set();
  for (const re of specials) for (const m of t.matchAll(re)) out.add(m[0].toLowerCase());

  // Capitalized multiword phrases (2–3 words) e.g., "Google Cloud", "Adobe XD", "Arc Flash"
  const multi = t.match(/\b([A-Z][A-Za-z0-9.+#\-]{2,}(?:\s+[A-Z][A-Za-z0-9.+#\-]{2,}){1,2})\b/g) || [];
  multi.forEach(p => { const k = p.toLowerCase(); if (!STOP.has(k)) out.add(k); });

  // Single tokens that look like names/tools (allow digits and .#+-)
  const singles = t.match(/\b[A-Za-z][A-Za-z0-9.+#\-]{1,}\b/g) || [];
  singles.forEach(tok => {
    const k = tok.toLowerCase();
    if (k.length > 1 && !STOP.has(k)) out.add(k);
  });

  return out;
}

export function makeBlocklist(resumeText = "", jdText = "") {
  const allow = extractTokens(resumeText);
  const jd = extractTokens(jdText);
  const block = new Set();
  for (const t of jd) if (!allow.has(t)) block.add(t);
  return { allow, block };
}

export function scrubSentences(text = "", terms = new Set()) {
  const list = [...terms];
  if (!list.length) return String(text).trim();
  const re = new RegExp(`\\b(?:${list.map(esc).join("|")})\\b`, "i");
  return String(text)
    .split(/(?<=[.!?])\s+/)
    .filter(s => !re.test(s))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function scrubBullets(bullets = [], terms = new Set()) {
  const list = [...terms];
  const re = list.length ? new RegExp(`\\b(?:${list.map(esc).join("|")})\\b`, "i") : null;
  return (Array.isArray(bullets) ? bullets : [])
    .map(String)
    .filter(b => !re || !re.test(b));
}
