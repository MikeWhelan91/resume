export default function TwoCol({ data = {} }) {
  const fmt = (s) => (s ? String(s).replace(/-/g, "–") : "");
  const links = Array.isArray(data.links) ? data.links : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const exp = Array.isArray(data.experience) ? data.experience : [];
  const edu = Array.isArray(data.education) ? data.education : [];

  return (
    <div className="resume resumeGrid">
      <aside className="sidebar">
        {data.name && <h1 style={{margin:'0 0 4px 0'}}>{data.name}</h1>}
        {(data.title || data.location) && (
          <div className="muted" style={{marginBottom:8}}>
            {[data.title, data.location].filter(Boolean).join(" • ")}
          </div>
        )}
        {(data.email || data.phone || links.length) && (
          <div className="muted" style={{marginBottom:8}}>
            {[data.email, data.phone, ...links.map((l)=>l?.url).filter(Boolean)].join(" · ")}
          </div>
        )}

        {skills.length > 0 && (
          <>
            <h2>Skills</h2>
            <div>{skills.map((s, i) => <span className="pill" key={i}>{s}</span>)}</div>
          </>
        )}

        {edu.length > 0 && (
          <>
            <h2>Education</h2>
            {edu.map((e, i) => (
              <div key={i}>
                <strong>{e.school}</strong>
                <div className="muted">
                  {[e.degree, e.start && fmt(e.start), e.end && fmt(e.end)].filter(Boolean).join(" • ")}
                </div>
              </div>
            ))}
          </>
        )}
      </aside>

      <main>
        {data.summary && (<><h2>Profile</h2><p>{data.summary}</p></>)}
        {exp.length > 0 && <h2>Experience</h2>}
        {exp.map((x, i) => (
          <section key={i}>
            {(x.company || x.role || x.start || x.end) && (
              <div className="row">
                <strong>{[x.company, x.role].filter(Boolean).join(" — ")}</strong>
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
      </main>
    </div>
  );
}

