export default function Classic({ data }) {
  const fmt = (s) => (s ? s.replace(/-/g, "–") : "");
  return (
    <div className="resume">
      <header>
        <h1>{data.name}</h1>
        <div className="muted">{[data.title, data.location].filter(Boolean).join(" • ")}</div>
        <div className="muted">
          {[data.email, data.phone, ...(data.links||[]).map(l=>l.url)].filter(Boolean).join(" · ")}
        </div>
        <div className="rule" />
      </header>

      {data.summary && (<><h2>Profile</h2><p>{data.summary}</p></>)}

      {Array.isArray(data.skills) && data.skills.length > 0 && (
        <>
          <h2>Skills</h2>
          <div>{data.skills.map((s, i) => <span className="pill" key={i}>{s}</span>)}</div>
        </>
      )}

      <h2>Experience</h2>
      {data.experience.map((x, i) => (
        <section key={i}>
          <div className="row"><strong>{x.company} — {x.role}</strong><span className="muted">{fmt(x.start)} – {x.end ? fmt(x.end) : "Present"}</span></div>
          {x.location && <div className="muted">{x.location}</div>}
          <ul>{x.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
        </section>
      ))}

      {data.education?.length > 0 && (
        <>
          <h2>Education</h2>
          {data.education.map((e, i) => (
            <div className="row" key={i}><div><strong>{e.school}</strong> — {e.degree}</div><div className="muted">{fmt(e.start)} – {fmt(e.end)}</div></div>
          ))}
        </>
      )}
    </div>
  );
}
