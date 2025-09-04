// Keep only lines likely to contain concrete nouns (skills/tools/certs/bullets/sections)
export function prefilterResume(text = "", maxChars = 2000) {
  const lines = String(text).split(/\r?\n/);
  const keep = [];
  const section = /(skills|tool|software|tech|experience|project|cert|license|education|equipment|systems?)/i;
  for (const l of lines) {
    if (/^[\s•\-–◆]/.test(l) || section.test(l) || /[A-Z][A-Za-z0-9.+#\- ]{2,}/.test(l)) {
      keep.push(l.trim());
    }
    if (keep.join("\n").length > maxChars) break;
  }
  return keep.join("\n");
}
