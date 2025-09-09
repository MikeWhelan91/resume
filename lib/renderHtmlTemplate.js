import Mustache from 'mustache'

export function renderHtml({ html, css, model }){
  const body = Mustache.render(html, model)
  // Wrap with a minimal doc that scales to A4 and embeds CSS
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
@page { size: A4; margin: 18mm 16mm; }
html, body { background: #fff; }
${css || ''}
</style>
</head>
<body>
${body}
</body></html>`
}
