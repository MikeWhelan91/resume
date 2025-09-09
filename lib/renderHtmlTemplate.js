import Mustache from 'mustache'
export function renderHtml({ html, css, model, options = {} }) {
  const { mode='preview', accent='#10b39f', density='Normal', ats=false } = options
  const body = Mustache.render(html, { ...model, ats })
  const LH = density === 'Compact' ? 1.32 : density === 'Relaxed' ? 1.48 : 1.4
  const PREVIEW = mode === 'preview'
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root { --accent:${accent}; --fs:11pt; --lh:${LH}; --text:#111; --muted:#666a73; --rule:#e7eaf0; }
  @page { size: A4; margin: 0; }
  html, body { margin:0; padding:0; ${PREVIEW ? 'background:#f6f7f9;' : 'background:#fff;'} }
  * { box-sizing:border-box; }
  .page {
    width:210mm; min-height:297mm; padding:18mm 16mm; margin:${PREVIEW ? '24px auto' : '0'};
    background:#fff; ${PREVIEW ? 'box-shadow:0 10px 28px rgba(16,24,40,.08);' : ''}
    color:var(--text); font: var(--fs)/var(--lh) Inter, Helvetica, Arial, sans-serif;
  }
  h1,h2,h3 { margin:0 0 2.4mm; line-height:1.2; }
  h2 { color:var(--accent); text-transform:uppercase; letter-spacing:.05em; font-weight:700; }
  .row { display:grid; grid-template-columns:1fr max-content; gap:6mm; align-items:baseline; }
  .dates { white-space:nowrap; color:var(--muted); font-weight:600; }
  .bullets { margin:1.6mm 0 0; padding-left:4.6mm; }
  .bullets li { margin:0 0 1.0mm; }
  .item { page-break-inside:avoid; }
  ${css || ''}
</style>
</head>
<body>
  <div class="page">${body}</div>
</body></html>`
}
