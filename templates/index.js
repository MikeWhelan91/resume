import { templates as registryTemplates } from './registry.generated.js'
export const templates = registryTemplates

export function getTemplate(id) {
  return templates.find(t => t.id === id) || templates[0]
}
export function listTemplates() {
  return templates.map(t => ({ id: t.id, name: t.name, engine: t.engine }))
}
