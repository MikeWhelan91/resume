export function enforceHeaderFromResume(data = {}, resumeText = "") {
  const text = "\n" + String(resumeText || "").toLowerCase() + "\n";
  const hasFrag = (s) => !!s && text.includes(String(s).toLowerCase());

  const out = { ...data };

  // Title/location: only keep if present in resume text
  if (out.title && !hasFrag(out.title)) delete out.title;
  if (out.location && !hasFrag(out.location)) delete out.location;

  // Email: must look like an email AND be present in resume text
  const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  if (out.email && (!emailRe.test(out.email) || !hasFrag(out.email))) delete out.email;

  // Phone: keep only if its digits appear in resume text digits
  if (out.phone) {
    const onlyDigits = (s) => String(s).replace(/\D+/g, "");
    const phoneDigits = onlyDigits(out.phone);
    const resumeDigits = onlyDigits(resumeText);
    if (!phoneDigits || !resumeDigits.includes(phoneDigits)) delete out.phone;
  }

  // Name: we usually keep what the model extracted, but never replace it with JD.
  // If model omitted name, we leave it empty rather than inventing it.
  return out;
}
