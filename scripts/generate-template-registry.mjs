import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TPL_DIR = path.join(ROOT, 'templates')
const SYS_DIR = path.join(TPL_DIR, '_system')
const OUT = path.join(TPL_DIR, 'registry.generated.js')

function readMaybe(p) {
  try { return fs.readFileSync(p, 'utf8') } catch { return '' }
}
function scanTemplates() {
  if (!fs.existsSync(TPL_DIR)) fs.mkdirSync(TPL_DIR)
  const dirs = fs.readdirSync(TPL_DIR).filter(d => fs.lstatSync(path.join(TPL_DIR, d)).isDirectory())
  const items = []
  for (const dir of dirs) {
    if (dir === '_system') continue
    const manifestPath = path.join(TPL_DIR, dir, 'template.json')
    if (!fs.existsSync(manifestPath)) continue
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (!m.id || !m.name || !m.engine) continue
    const htmlPath = path.join(TPL_DIR, dir, 'template.html')
    const cssPath  = path.join(TPL_DIR, dir, 'style.css')
    const coverHtmlPath = path.join(TPL_DIR, dir, 'cover.html')
    const coverCssPath  = path.join(TPL_DIR, dir, 'cover.css')
    const html = readMaybe(htmlPath)
    const css  = readMaybe(cssPath)
    const coverHtml = readMaybe(coverHtmlPath)
    const coverCss  = readMaybe(coverCssPath)
    items.push({
      id: m.id, name: m.name, engine: m.engine, dir,
      internal: !!m.internal,
      html, css, coverHtml, coverCss
    })
  }
  // system templates (e.g. cover letter fallback)
  if (fs.existsSync(SYS_DIR)) {
    const files = fs.readdirSync(SYS_DIR).filter(f => f.endsWith('.json'))
    for (const f of files) {
      const base = f.replace(/\.json$/, '')
      const manifestPath = path.join(SYS_DIR, f)
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      if (!m.id || !m.name || !m.engine) continue
      const html = readMaybe(path.join(SYS_DIR, `${base}.html`))
      const css  = readMaybe(path.join(SYS_DIR, `${base}.css`))
      items.push({
        id: m.id, name: m.name, engine: m.engine,
        internal: !!m.internal,
        html: '', css: '',
        coverHtml: html, coverCss: css
      })
    }
  }
  return items
}
function emit(items) {
  const lines = []
  lines.push('// AUTO-GENERATED. Do not edit by hand.')
  lines.push('// Templates registry with embedded HTML/CSS as strings.')
  lines.push('export const templates = [')
  for (const t of items) {
    // JSON.stringify safely escapes contents as plain JS strings
    lines.push(`  { id: ${JSON.stringify(t.id)}, name: ${JSON.stringify(t.name)}, engine: ${JSON.stringify(t.engine)}, internal: ${JSON.stringify(t.internal)}, html: ${JSON.stringify(t.html)}, css: ${JSON.stringify(t.css)}, coverHtml: ${JSON.stringify(t.coverHtml)}, coverCss: ${JSON.stringify(t.coverCss)} },`)
  }
  lines.push(']')
  fs.writeFileSync(OUT, lines.join('\n'))
  console.log(`Generated ${OUT} with ${items.length} template(s).`)
}

emit(scanTemplates())
