export default function TwoCol({ data }) {
  const fmt = (s) => (s ? s.replace(/-/g, "–") : "");
  return (
    <div className="resume resumeGrid">
      <aside className="sidebar">
        <h1 style={{margin:'0 0 4px 0'}}>{data.name}</h1>
        <div className="muted" style={{marginBottom:8}}>{[data.title, data.location].filter(Boolean).join(" • ")}</div>
        <div className="muted" style={{marginBottom:8}}>
          {[data.email, data.phone, ...(data.links||[]).map(l=>l.url)].filter(Boolean).join(" · ")}
        </div>
        {Array.isArray(data.skills) && data.skills.length > 0 && (
          <>
            <h2>Skills</h2>
            <div>{data.skills.map((s, i) => <span className="pill" key={i}>{s}</span>)}</div>
          </>
        )}
        {data.education?.length > 0 && (
          <>
            <h2>Education</h2>
            {data.education.map((e, i) => (
              <div key={i}><strong>{e.school}</strong><div className="muted">{e.degree} • {fmt(e.start)} – {fmt(e.end)}</div></div>
            ))}
          </>
        )}
      </aside>

      <main>
        {data.summary && (<><h2>Profile</h2><p>{data.summary}</p></>)}
        <h2>Experience</h2>
        {data.experience.map((x, i) => (
          <section key={i}>
            <div className="row"><strong>{x.company} — {x.role}</strong><span className="muted">{fmt(x.start)} – {x.end ? fmt(x.end) : "Present"}</span></div>
            {x.location && <div className="muted">{x.location}</div>}
            <ul>{x.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          </section>
        ))}
      </main>
    </div>
  );
}
