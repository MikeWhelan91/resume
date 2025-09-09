import { templates as _all } from './registry.generated.js'
export { templates as _all } from './registry.generated.js'

const htmlTemplates = _all.filter(t => (t.engine || 'html') === 'html')

export function listTemplates() {
  return htmlTemplates
    .filter(t => !t.internal)
    .map(({ id, name }) => ({ id, name, engine: 'html' }))
}

export function getTemplate(id) {
  return htmlTemplates.find(t => t.id === id) || htmlTemplates[0]
}
