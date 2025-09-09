import { templates as registryTemplates } from './registry.generated.js'
import * as T_minimal_reactpdf from './minimal-reactpdf/index.jsx'

const modules = {
  'minimal-reactpdf': T_minimal_reactpdf,
}

export const templates = registryTemplates.map(t => (
  t.engine === 'react-pdf' && modules[t.id]
    ? { ...t, module: modules[t.id] }
    : t
))

export function getTemplate(id) {
  return templates.find(t => t.id === id) || templates[0]
}
export function listTemplates() {
  return templates.map(t => ({ id: t.id, name: t.name, engine: t.engine }))
}
