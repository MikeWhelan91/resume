export { templates } from './registry.generated'
export function getTemplate(id){
  const all = require('./registry.generated.js').templates
  return all.find(t => t.id === id) || all[0]
}
export function listTemplates(){
  const all = require('./registry.generated.js').templates
  return all.map(t => ({ id: t.id, name: t.name, engine: t.engine }))
}
