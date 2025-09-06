export default function Centered({ data = {} }) {
  const fmt = (s) => (s ? String(s).replace(/-/g, "–") : "");
  const links = Array.isArray(data.links) ? data.links : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const exp = Array.isArray(data.experience) ? data.experience : [];
  const edu = Array.isArray(data.education) ? data.education : [];

  return (
    <div className="resume centeredHeader" data-paper>
      <header>
        {data.name && <h1>{data.name}</h1>}
        {(data.title || data.location) && (
          <div className="muted">{[data.title, data.location].filter(Boolean).join(" • ")}</div>
        )}
        {(data.email || data.phone || links.length) && (
          <div className="muted">
            {[data.email, data.phone, ...links.map((l) => l?.url).filter(Boolean)].join(" · ")}
          </div>
        )}
        <div className="rule" />
      </header>

      {data.summary && (<><h2>Profile</h2><p>{data.summary}</p></>)}

      {skills.length > 0 && (
        <>
          <h2>Skills</h2>
          <div>{skills.map((s, i) => <span className="pill" key={i}>{s}</span>)}</div>
        </>
      )}

      {exp.length > 0 && <h2>Experience</h2>}
      {exp.map((x, i) => (
        <section key={i}>
          {x.company && <strong>{x.company}</strong>}
          {(x.role || x.start || x.end != null) && (
            <div className="row">
              {x.role && <div>{x.role}</div>}
              {(x.start || x.end != null) && (
                <span className="muted">{fmt(x.start)} – {x.end == null ? "Present" : fmt(x.end)}</span>
              )}
            </div>
          )}
          {x.location && <div className="muted">{x.location}</div>}
          {Array.isArray(x.bullets) && x.bullets.length > 0 && (
            <ul>{x.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          )}
        </section>
      ))}

      {edu.length > 0 && <h2>Education</h2>}
      {edu.map((e, i) => (
        <div key={i}>
          {e.school && <strong>{e.school}</strong>}
          {(e.degree || e.grade || e.start || e.end) && (
            <div className="row">
              <div>{[e.degree, e.grade].filter(Boolean).join(" — ")}</div>
              {(e.start || e.end) && (
                <div className="muted">{fmt(e.start)} – {fmt(e.end)}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
