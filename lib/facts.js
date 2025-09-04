const TECH_TERMS = [
  // common stacks/tools – extend as needed
  "javascript","typescript","react","next.js","node","express","c#",".net",".net core","asp.net",
  "java","spring","python","django","flask","go","rust","php","laravel","ruby","rails",
  "html","css","sass","tailwind","redux","zustand",
  "mysql","postgres","sqlite","mongodb","dynamodb","sql","tsql","mssql",
  "aws","azure","gcp","docker","kubernetes","terraform","ansible","linux",
  "jest","vitest","cypress","playwright","storybook",
  "git","github","gitlab","jira","confluence","postman","swagger","rest","graphql",
  "rabbitmq","kafka","redis","elasticsearch","s3","lambda","cloudfront",
  "figma","sketch","xd" // keep, so we can detect and block if not allowed
];

// simple term finder over resume text
export function extractAllowed(text = "") {
  const t = " " + String(text).toLowerCase() + " ";
  const set = new Set();
  TECH_TERMS.forEach(term => {
    const needle = " " + term.toLowerCase() + " ";
    if (t.includes(needle)) set.add(term.toLowerCase());
  });
  // also collect proper nouns from obvious CV lines (companies, roles)
  const lines = String(text).split(/\r?\n/).slice(0, 400);
  lines.forEach(l => {
    const m = l.match(/\b([A-Z][A-Za-z0-9.&+-]{2,})\b/g);
    if (m) m.forEach(w => set.add(w.toLowerCase()));
  });
  return set;
}

// return list of offending terms found in output
export function findViolations(output = "", allowedSet, jd = "") {
  const out = String(output).toLowerCase();
  const violations = [];
  TECH_TERMS.forEach(term => {
    const k = term.toLowerCase();
    if (!allowedSet.has(k) && out.includes(k)) {
      violations.push(k);
    }
  });
  return violations;
}

// aggressively remove or soften terms not allowed
export function sanitizeOutput(output = "", allowedSet, jd = "") {
  let text = String(output);
  const lowerJD = jd.toLowerCase();

  // remove any bullet line that contains a non-allowed tech term
  text = text
    .split(/\n/)
    .filter(line => {
      const l = line.toLowerCase();
      const hit = TECH_TERMS.some(term => l.includes(term) && !allowedSet.has(term));
      return !hit; // drop bullets with forbidden terms
    })
    .join("\n");

  // mild cleanups (double spaces, stray bullets)
  text = text.replace(/[•●]/g, "-").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

