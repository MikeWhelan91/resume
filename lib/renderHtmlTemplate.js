import Mustache from 'mustache'

export function renderHtml({ html, css, model }) {
  const body = Mustache.render(html, model)
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  /* Page & print control */
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  * { box-sizing: border-box; }
  /* A4 screen wrapper: identical padding for all themes */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 16mm;
    margin: 0 auto;
    font-family: Helvetica, Arial, sans-serif;
    color: #111;
  }
  ${css || ''}
</style>
</head>
<body>
  <div class="page">${body}</div>
</body></html>`
}
