export function normalizeResumeData(raw = {}) {
  const out = { ...raw };

  // Ensure arrays
  out.skills = Array.isArray(out.skills)
    ? out.skills
        .map((s) => {
          const str = String(s).trim();
          return str ? str[0].toUpperCase() + str.slice(1) : "";
        })
        .filter(Boolean)
    : [];
  out.experience = Array.isArray(out.experience) ? out.experience : [];
  out.education = Array.isArray(out.education) ? out.education : [];
  out.links = Array.isArray(out.links) ? out.links : [];

  // Links: string -> {label,url}
  out.links = out.links.map((l) => {
    if (typeof l === "string") {
      const label = l.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30);
      return { label, url: l };
    }
    return {
      label: String(l?.label || l?.url || "").slice(0, 30),
      url: String(l?.url || ""),
    };
  });

  // Helpers
  const toArray = (v) =>
    Array.isArray(v)
      ? v.map(String)
      : typeof v === "string"
      ? v.split(/\n+|•|\u2022/).map((s) => s.trim()).filter(Boolean)
      : [];

  const toYmOrNull = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (/present/i.test(s)) return null;
    // Coerce "May 2021" -> "2021-05" if possible; else keep raw
    const m = s.match(
      /(20\d{2}|19\d{2})[-/ .]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})/i
    );
    if (!m) return s;
    const year = m[1];
    const map = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const m2 = /^\d+$/.test(m[2]) ? Number(m[2]) : map[m[2].toLowerCase()];
    return year && m2 ? `${year}-${String(m2).padStart(2, "0")}` : s;
  };

  // Experience: coerce bullets and dates; keep row if it has any useful content
  out.experience = out.experience
    .map((x) => ({
      company: String(x?.company || "").trim(),
      role: String(x?.role || "").trim(),
      start: toYmOrNull(x?.start),
      end: toYmOrNull(x?.end),
      location: x?.location ? String(x.location) : undefined,
      bullets: toArray(x?.bullets),
    }))
    .filter((e) => e.company || e.role || e.bullets.length);

  // Education: coerce dates and keep if has any content
  out.education = out.education
    .map((e) => ({
      school: String(e?.school || "").trim(),
      degree: String(e?.degree || "").trim(),
      start: toYmOrNull(e?.start) || "",
      end: toYmOrNull(e?.end) || "",
      grade: e?.grade ? String(e.grade).trim() : undefined,
    }))
    .filter((e) => e.school || e.degree || e.start || e.end || e.grade);

  // Scalar fields as strings
  ["name", "title", "email", "phone", "location", "summary"].forEach((k) => {
    if (out[k] != null) out[k] = String(out[k]);
  });

  return out;
}

