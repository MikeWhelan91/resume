export default function ControlsPanel({
  accent,
  setAccent,
  density,
  setDensity,
  atsMode,
  setAtsMode,
  onExportPdf,
  onExportDocx,
  onExportClPdf,
  onExportClDocx,
}) {
  const colors = ['#00C9A7','#A3FF6F','#0EA5A6','#2563EB','#F59E0B','#EF4444'];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Theme</h3>
        <div className="flex gap-2 mb-2">
          {colors.map(c => (
            <button key={c} onClick={()=>setAccent(c)} className={`w-6 h-6 rounded-full border ${accent===c?'ring-2 ring-[var(--ink)]':''}`} style={{background:c}} aria-label={c}></button>
          ))}
        </div>
        <label className="block text-sm mb-1">Density</label>
        <select className="w-full border rounded p-1" value={density} onChange={e=>setDensity(e.target.value)}>
          <option value="compact">Compact</option>
          <option value="normal">Normal</option>
          <option value="cozy">Cozy</option>
        </select>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Document</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={atsMode} onChange={e=>setAtsMode(e.target.checked)} />ATS mode
        </label>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Export</h3>
        <div className="space-y-2">
          <button className="tc-btn-primary w-full" onClick={onExportPdf}>Download CV (PDF)</button>
          <button className="tc-btn-quiet w-full" onClick={onExportDocx}>Download CV (DOCX)</button>
          <button className="tc-btn-quiet w-full" onClick={onExportClPdf}>Download Cover Letter (PDF)</button>
          <button className="tc-btn-quiet w-full" onClick={onExportClDocx}>Download Cover Letter (DOCX)</button>
        </div>
      </div>
    </div>
  );
}
