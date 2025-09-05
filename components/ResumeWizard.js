import { useState, useEffect } from "react";

const emptyResume = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  links: [],
  skills: [],
  experience: [],
  education: []
};

export default function ResumeWizard({ initialData, onCancel, onComplete, autosaveKey, template, onTemplateChange, templateInfo }) {
  const [data, setData] = useState(initialData || emptyResume);
  const [step, setStep] = useState(0);
  const [jobDesc, setJobDesc] = useState("");
  const steps = ["basics", "skills", "work", "education", "review"];

  useEffect(() => {
    if (autosaveKey) {
      try {
        localStorage.setItem(autosaveKey, JSON.stringify(data));
      } catch {}
    }
  }, [data, autosaveKey]);

  function update(field, value) {
    setData((d) => ({ ...d, [field]: value }));
  }

  function next() { setStep((s) => Math.min(s + 1, steps.length - 1)); }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }

  function addLink() { update("links", [...data.links, { label: "", url: "" }]); }
  function removeLink(i) { update("links", data.links.filter((_, idx) => idx !== i)); }

  function addExp() {
    update("experience", [
      ...data.experience,
      { company: "", role: "", start: "", end: "", location: "", bullets: [] }
    ]);
  }
  function removeExp(i) { update("experience", data.experience.filter((_, idx) => idx !== i)); }

  function addEdu() {
    update("education", [
      ...data.education,
      { school: "", degree: "", start: "", end: "", grade: "" }
    ]);
  }
  function removeEdu(i) { update("education", data.education.filter((_, idx) => idx !== i)); }

  function handleSubmit(e) {
    e.preventDefault();
    onComplete && onComplete(data, jobDesc);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      {step === 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <h2>Basics</h2>
          <input placeholder="Name" value={data.name} onChange={e => update("name", e.target.value)} required />
          <input placeholder="Title" value={data.title} onChange={e => update("title", e.target.value)} />
          <input placeholder="Email" type="email" value={data.email} onChange={e => update("email", e.target.value)} required />
          <input placeholder="Phone" value={data.phone} onChange={e => update("phone", e.target.value)} />
          <input placeholder="Location" value={data.location} onChange={e => update("location", e.target.value)} />
          <textarea placeholder="Summary" rows={4} value={data.summary} onChange={e => update("summary", e.target.value)} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Links</div>
            {data.links.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                <input placeholder="Label" value={l.label} onChange={e => {
                  const arr = [...data.links];
                  arr[i] = { ...arr[i], label: e.target.value };
                  update("links", arr);
                }} />
                <input placeholder="URL" value={l.url} onChange={e => {
                  const arr = [...data.links];
                  arr[i] = { ...arr[i], url: e.target.value };
                  update("links", arr);
                }} />
                <button type="button" onClick={() => removeLink(i)}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addLink}>Add link</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "grid", gap: 8 }}>
          <h2>Skills</h2>
          <textarea
            rows={6}
            value={data.skills.join("\n")}
            onChange={e => update("skills", e.target.value.split(/\n+/).map(s => s.trim()).filter(Boolean))}
            placeholder="One skill per line"
          />
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gap: 8 }}>
          <h2>Work Experience</h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ border: "1px solid #ccc", padding: 8 }}>
              <input placeholder="Company" value={exp.company} onChange={e => {
                const arr = [...data.experience]; arr[i] = { ...arr[i], company: e.target.value }; update("experience", arr);
              }} />
              <input placeholder="Role" value={exp.role} onChange={e => {
                const arr = [...data.experience]; arr[i] = { ...arr[i], role: e.target.value }; update("experience", arr);
              }} />
              <input placeholder="Start (YYYY-MM)" value={exp.start} onChange={e => {
                const arr = [...data.experience]; arr[i] = { ...arr[i], start: e.target.value }; update("experience", arr);
              }} />
              <input placeholder="End (YYYY-MM or blank)" value={exp.end || ""} onChange={e => {
                const arr = [...data.experience]; arr[i] = { ...arr[i], end: e.target.value }; update("experience", arr);
              }} />
              <input placeholder="Location" value={exp.location || ""} onChange={e => {
                const arr = [...data.experience]; arr[i] = { ...arr[i], location: e.target.value }; update("experience", arr);
              }} />
              <textarea
                placeholder="Bullets (one per line)"
                rows={4}
                value={(exp.bullets || []).join("\n")}
                onChange={e => {
                  const arr = [...data.experience];
                  arr[i] = { ...arr[i], bullets: e.target.value.split(/\n+/).map(s => s.trim()).filter(Boolean) };
                  update("experience", arr);
                }}
              />
              <button type="button" onClick={() => removeExp(i)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addExp}>Add experience</button>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "grid", gap: 8 }}>
          <h2>Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ border: "1px solid #ccc", padding: 8 }}>
              <input placeholder="School" value={edu.school} onChange={e => {
                const arr = [...data.education]; arr[i] = { ...arr[i], school: e.target.value }; update("education", arr);
              }} />
              <input placeholder="Degree" value={edu.degree} onChange={e => {
                const arr = [...data.education]; arr[i] = { ...arr[i], degree: e.target.value }; update("education", arr);
              }} />
              <input placeholder="Start (YYYY-MM)" value={edu.start} onChange={e => {
                const arr = [...data.education]; arr[i] = { ...arr[i], start: e.target.value }; update("education", arr);
              }} />
              <input placeholder="End (YYYY-MM)" value={edu.end} onChange={e => {
                const arr = [...data.education]; arr[i] = { ...arr[i], end: e.target.value }; update("education", arr);
              }} />
              <input placeholder="Grade" value={edu.grade || ""} onChange={e => {
                const arr = [...data.education]; arr[i] = { ...arr[i], grade: e.target.value }; update("education", arr);
              }} />
              <button type="button" onClick={() => removeEdu(i)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addEdu}>Add education</button>
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "grid", gap: 8 }}>
          <h2>Review</h2>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", background: "#f5f5f5", padding: 8 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Template:</label>
            <select value={template} onChange={e => onTemplateChange && onTemplateChange(e.target.value)}>
              <option value="classic">Classic (ATS)</option>
              <option value="twoCol">Two-Column</option>
              <option value="centered">Centered Header</option>
              <option value="sidebar">Sidebar</option>
            </select>
            {templateInfo && templateInfo[template] && (
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>{templateInfo[template]}</div>
            )}
          </div>
          <textarea
            rows={8}
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            placeholder="Paste job description here"
            required
            style={{ width: "100%" }}
          />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {step > 0 && <button type="button" onClick={prev}>Back</button>}
          {step < steps.length - 1 && <button type="button" onClick={next}>Next</button>}
          {step === steps.length - 1 && <button type="submit">Generate</button>}
        </div>
      </div>
    </form>
  );
}
