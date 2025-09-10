import Mustache from 'mustache';

export function renderHtml({ html, css = '', model = {}, options = {} }) {
  const { mode = 'preview', accent = '#10b39f', density = 'Normal', ats = false } = options;
  const body = Mustache.render(html, model);

  return `<!doctype html>
<html data-mode="${mode}"><head><meta charset="utf-8"/>
<style>
:root { --accent: ${accent}; }
@page { size: A4; margin: 14mm; }
html, body { margin:0; padding:0; height:auto; }
${css}
</style></head>
<body data-density="${density}" data-ats="${ats ? '1' : '0'}">${body}</body></html>`;
}

