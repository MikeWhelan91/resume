import fs from 'fs'
import path from 'path'
const ROOT = process.cwd()
const TEMPLATES_DIR = path.join(ROOT, 'templates')
const OUT = path.join(TEMPLATES_DIR, 'registry.generated.js')

function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')) }

function scan(){
  if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR)
  const dirs = fs.readdirSync(TEMPLATES_DIR).filter(d => fs.lstatSync(path.join(TEMPLATES_DIR,d)).isDirectory())
  const entries = []
  for (const dir of dirs){
    const manifestPath = path.join(TEMPLATES_DIR, dir, 'template.json')
    if (!fs.existsSync(manifestPath)) continue
    const m = readJSON(manifestPath)
    if (!m.id || !m.name || !m.engine) continue
    entries.push({ dir, ...m })
  }
  const lines = []
  lines.push('// AUTO-GENERATED. Do not edit by hand.')
  for (const e of entries){
    const safeId = e.id.replace(/[^a-zA-Z0-9_$]/g, '_')
    if (e.engine === 'react-pdf'){
      lines.push(`import * as T_${safeId} from './${e.dir}/index.jsx'`)
    } else {
      lines.push(`import html_${safeId} from './${e.dir}/template.html?raw'`)
      lines.push(`import css_${safeId} from './${e.dir}/style.css?raw'`)
    }
  }
  lines.push('export const templates = [')
  for (const e of entries){
    const safeId = e.id.replace(/[^a-zA-Z0-9_$]/g, '_')
    if (e.engine === 'react-pdf'){
      lines.push(`  { id: '${e.id}', name: '${e.name}', engine: 'react-pdf', module: T_${safeId} },`)
    } else {
      lines.push(`  { id: '${e.id}', name: '${e.name}', engine: 'html', html: html_${safeId}, css: css_${safeId} },`)
    }
  }
  lines.push(']')
  fs.writeFileSync(OUT, lines.join('\n'))
  console.log(`Generated ${OUT} with ${entries.length} template(s).`)
}
scan()
