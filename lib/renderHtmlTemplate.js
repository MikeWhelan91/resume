import Mustache from 'mustache'

export function renderHtml({ html, css, model }) {
  const body = Mustache.render(html, model)
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #f6f7f9; }
  * { box-sizing: border-box; }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 16mm;
    margin: 24px auto;
    background: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,.12);
    color: #111;
    font-family: Inter, Helvetica, Arial, sans-serif;
  }
  ${css || ''}
</style>
</head>
<body>
  <div class="page">${body}</div>
</body></html>`
}
