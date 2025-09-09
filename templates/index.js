/*
  Make sure the registry exposes two things per template:
  {
    id, name, engine:'html',
    html, css,
    // optional:
    coverHtml, coverCss,
    internal?: boolean
  }

  Add the internal fallback for cover:
*/
import coverDefaultHtml from './_system/cover-default.html';
import coverDefaultCss from './_system/cover-default.css';
import { templates as REGISTRY } from './registry.generated.js';

// If your registry already has arrays, just push:
const _internalCover = {
  id: '_cover-default',
  name: 'System Cover (Default)',
  engine: 'html',
  internal: true,
  coverHtml: coverDefaultHtml,
  coverCss: coverDefaultCss,
};

// Ensure exported helpers:
let TEMPLATES = Array.isArray(REGISTRY) ? REGISTRY : [];
if (!TEMPLATES.find(t => t.id === '_cover-default')) TEMPLATES = [...TEMPLATES, _internalCover];

export function listTemplates(){
  return TEMPLATES.filter(t => !t.internal);
}
export function getTemplate(id){
  return TEMPLATES.find(t => t.id === id);
}
