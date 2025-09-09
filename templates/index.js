/*
  Make sure the registry exposes two things per template:
  {
    id, name, engine:'html',
    html, css,
    // optional:
    coverHtml, coverCss,
    internal?: boolean
  }

*/
import { templates as REGISTRY } from './registry.generated.js';

// Ensure exported helpers:
const TEMPLATES = Array.isArray(REGISTRY) ? REGISTRY : [];

export function listTemplates(){
  return TEMPLATES.filter(t => !t.internal);
}
export function getTemplate(id){
  return TEMPLATES.find(t => t.id === id);
}
