const STOP = new Set([
  "and","with","for","the","a","an","to","of","in","on","at","as","is","are","be","or",
  "team","skills","experience","engineer","developer","junior","senior","manager",
  "hybrid","remote","full-time","part-time","contract","about","profile","summary",
  "please","submit","benefits","found","job","post","medical","insurance"
]);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Decide if a token is "concrete": contains punctuation/digits, is ALLCAPS acronym, or is capitalized multiword
function isConcreteSingle(tok) {
  if (!tok) return false;
  const k = tok.toLowerCase();
  if (STOP.has(k) || k.length < 2) return false;

  // keep tokens that look like named things: contain . + # - digits
  if (/[.+#\-0-9]/.test(tok)) return true;

  // ALLCAPS acronyms (2-6 chars): e.g., HIPAA, OSHA, CNC, EMR
  if (/^[A-Z]{2,6}$/.test(tok)) return true;

  // TitleCase singles like AutoCAD, QuickBooks, Salesforce
  if (/^[A-Z][A-Za-z0-9.+#\-]{2,}$/.test(tok)) return true;

  // Lowercase generics like "support" are not concrete
  return false;
}

export function extractTokens(text = "") {
  const t = String(text);

  // Capitalized multiword phrases (2–3 words), e.g., "Google Cloud", "Adobe XD"
  const multi = t.match(/\b([A-Z][A-Za-z0-9.+#\-]{2,}(?:\s+[A-Z][A-Za-z0-9.+#\-]{2,}){1,2})\b/g) || [];
  const out = new Set(multi.map(s => s.toLowerCase()));

  // Single tokens
  const singles = t.match(/\b[A-Za-z][A-Za-z0-9.+#\-]{1,}\b/g) || [];
  for (const tok of singles) {
    if (isConcreteSingle(tok)) out.add(tok.toLowerCase());
  }

  return out;
}

export function makeBlocklist(resumeText = "", jdText = "") {
  const allow = extractTokens(resumeText);
  const jd = extractTokens(jdText);

  // block only JD items that are NOT allowed
  const block = new Set();
  for (const t of jd) if (!allow.has(t)) block.add(t);

  return { allow, block };
}

// Don’t scrub greetings/sign-offs or short lines
function isProtectedSentence(s) {
  const l = s.trim();
  if (l.length < 25) return true; // keep very short lines
  return /^(dear|hello|hi|thanks|thank you|sincerely|best|kind regards)/i.test(l);
}

// Remove a sentence only if:
//  - it contains a blocklisted term, and
//  - it does NOT also contain an allowed term (mixed content), and
//  - it’s not a protected line
export function scrubSentences(text = "", terms = new Set(), allow = new Set()) {
  const blocked = [...terms];
  if (!blocked.length) return String(text).trim();

  const reBlock = new RegExp(`\b(?:${blocked.map(esc).join("|")})\b`, "i");
  const reAllow = allow.size ? new RegExp(`\b(?:${[...allow].map(esc).join("|")})\b`, "i") : null;

  const parts = String(text).split(/(?<=[.!?])\s+/);
  const kept = parts.filter(s => {
    if (isProtectedSentence(s)) return true;
    const hasBlock = reBlock.test(s);
    const hasAllow = reAllow ? reAllow.test(s) : false;
    return !(hasBlock && !hasAllow);
  });

  return kept.join(" ").replace(/\s{2,}/g, " ").trim();
}

export function scrubBullets(bullets = [], terms = new Set(), allow = new Set()) {
  const blocked = [...terms];
  const reBlock = blocked.length ? new RegExp(`\b(?:${blocked.map(esc).join("|")})\b`, "i") : null;
  const reAllow = allow.size ? new RegExp(`\b(?:${[...allow].map(esc).join("|")})\b`, "i") : null;

  return (Array.isArray(bullets) ? bullets : [])
    .map(String)
    .filter(b => {
      if (!reBlock) return true;
      const hasBlock = reBlock.test(b);
      const hasAllow = reAllow ? reAllow.test(b) : false;
      // keep mixed bullets that reference allowed terms too
      return !(hasBlock && !hasAllow);
    });
}
