import Mustache from 'mustache';

export function renderHtml({ html, css='', model={}, options={} }){
  const { mode='preview', accent='#10b39f', density='Normal' } = options;
  const PREVIEW = mode === 'preview';
  const LH = density === 'Compact' ? 1.32 : density === 'Relaxed' ? 1.48 : 1.4;

  const body = Mustache.render(html, model);

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  :root{ --accent:${accent}; --fs:11pt; --lh:${LH}; --text:#111; --muted:#666; --rule:#e7eaf0; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; ${PREVIEW ? 'background:#f6f7f9;' : 'background:#fff;'} }
  .page{
    width:210mm; min-height:297mm;
    ${PREVIEW ? 'margin:24px auto; box-shadow:0 10px 26px rgba(16,24,40,.08);' : 'margin:0;'}
    background:#fff; color:var(--text);
    font: var(--fs)/var(--lh) Inter, Arial, sans-serif;
    padding: 18mm 16mm;
  }
  h1,h2,h3{ margin:0 0 2.4mm; line-height:1.2; }
  ${css}
</style></head>
<body><div class="page">${body}</div></body></html>`;
}
