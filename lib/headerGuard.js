export function enforceHeaderFromResume(data = {}, resumeText = "") {
  const out = { ...data };
  const norm = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const rt = norm(resumeText);

  const present = v => {
    const n = norm(v);
    return !!n && rt.includes(n);
  };

  // email must literally appear in the résumé text
  const email = out.email && String(out.email).trim();
  if (email && !resumeText.toLowerCase().includes(email.toLowerCase())) delete out.email;

  // phone digits must be present in résumé digits
  const digits = s => String(s || "").replace(/\D+/g, "");
  if (out.phone) {
    const pd = digits(out.phone);
    const rd = digits(resumeText);
    if (!pd || !rd.includes(pd)) delete out.phone;
  }

  // title/location must literally appear somewhere in the résumé text
  if (out.title && !present(out.title)) delete out.title;
  if (out.location && !present(out.location)) delete out.location;

  // name is left as-is (we never invent)
  return out;
}
