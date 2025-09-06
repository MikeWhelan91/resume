import React from "react";

/**
 * Modern two-column HTML resume template (grid-based, ATS-safe).
 * Expects prop: { data } with shape used by other templates:
 * { name, title?, email, phone?, location?, links[], summary?, skills[], experience[], education[] }
 */
export default function Modern({ data = {} }) {
  const {
    name = "",
    title = "",
    email = "",
    phone = "",
    location = "",
    links = [],
    summary = "",
    skills = [],
    experience = [],
    education = [],
  } = data;

  // Helpers
  const meta = [title, location].filter(Boolean).join(" • ");
  const contacts = [email, phone, ...links.map(l => l?.url || "").filter(Boolean)].filter(Boolean).join(" · ");

  return (
    <div className="resume">
      <div data-paper className="paper modern">
        {/* Header */}
        <header className="modern-header">
          <h1 className="modern-name">{name}</h1>
          {meta ? <div className="modern-meta">{meta}</div> : null}
          {contacts ? <div className="modern-contacts">{contacts}</div> : null}
        </header>

        {/* Grid layout: left meta, right body */}
        <main className="modern-grid">
          <aside className="modern-left">
            {/* Profile */}
            {summary ? (
              <section className="modern-section">
                <h2 className="modern-h2">Profile</h2>
                <p className="modern-p">{summary}</p>
              </section>
            ) : null}

            {/* Skills */}
            {skills?.length ? (
              <section className="modern-section">
                <h2 className="modern-h2">Skills</h2>
                <ul className="modern-skill-list">
                  {skills.map((s, i) => (
                    <li key={i} className="modern-skill">{s}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Education */}
            {education?.length ? (
              <section className="modern-section">
                <h2 className="modern-h2">Education</h2>
                <ul className="modern-edu-list">
                  {education.map((e, i) => (
                    <li key={i} className="modern-edu-item avoid-break">
                      <div className="modern-edu-line">
                        <span className="modern-edu-school">{e.school}</span>
                        {e.degree ? <span className="modern-edu-degree"> — {e.degree}</span> : null}
                      </div>
                      <div className="modern-edu-dates">
                        {[e.start, e.end].filter(Boolean).join(" – ")}
                      </div>
                      {e.grade ? <div className="modern-edu-grade">{e.grade}</div> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>

          <section className="modern-right">
            {/* Experience */}
            <section className="modern-section">
              <h2 className="modern-h2">Experience</h2>
              <ul className="modern-exp-list">
                {(experience || []).map((x, i) => (
                  <li key={i} className="modern-exp-item avoid-break">
                    <div className="modern-exp-head">
                      <div className="modern-exp-role">
                        <span className="modern-exp-company">{x.company}</span>
                        {x.role ? <span className="modern-exp-sep"> — </span> : null}
                        {x.role ? <span className="modern-exp-title">{x.role}</span> : null}
                      </div>
                      <div className="modern-exp-dates">
                        {[x.start, x.end || "Present"].filter(Boolean).join(" – ")}
                      </div>
                    </div>
                    {x.location ? <div className="modern-exp-loc">{x.location}</div> : null}
                    {(x.bullets || []).length ? (
                      <ul className="modern-bullets">
                        {x.bullets.map((b, j) => (
                          <li key={j} className="modern-bullet">{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
