import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TPL_DIR = path.join(ROOT, 'templates')
const OUT = path.join(TPL_DIR, 'registry.generated.js')

function readMaybe(p) {
  try { return fs.readFileSync(p, 'utf8') } catch { return '' }
}
function scanTemplates() {
  if (!fs.existsSync(TPL_DIR)) fs.mkdirSync(TPL_DIR)
  const dirs = fs.readdirSync(TPL_DIR).filter(d => fs.lstatSync(path.join(TPL_DIR, d)).isDirectory())
  const items = []
  for (const dir of dirs) {
    if (dir.startsWith('_')) continue
    const manifestPath = path.join(TPL_DIR, dir, 'template.json')
    if (!fs.existsSync(manifestPath)) continue
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (!m.id || !m.name) continue
    const htmlPath = path.join(TPL_DIR, dir, 'template.html')
    const cssPath  = path.join(TPL_DIR, dir, 'style.css')
    const html = readMaybe(htmlPath)
    const css  = readMaybe(cssPath)
    items.push({ id: m.id, name: m.name, internal: !!m.internal, html, css })
  }
  return items
}
function emit(items) {
  const lines = []
  lines.push('// AUTO-GENERATED. Do not edit by hand.')
  lines.push('// Templates registry with embedded HTML/CSS as strings.')
  lines.push('export const templates = [')
  for (const t of items) {
    lines.push(`  { id: ${JSON.stringify(t.id)}, name: ${JSON.stringify(t.name)}, internal: ${JSON.stringify(t.internal)}, html: ${JSON.stringify(t.html)}, css: ${JSON.stringify(t.css)} },`)
  }
  lines.push(']')
  fs.writeFileSync(OUT, lines.join('\n'))
  console.log(`Generated ${OUT} with ${items.length} template(s).`)
}

emit(scanTemplates())
