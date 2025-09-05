import { Resume } from '../../lib/schema/resume';
import * as Clean from './Clean';
import * as Professional from './Professional';
import * as Modern from './Modern';
import { ReactElement } from 'react';

export interface Template {
  renderHtml: (resume: Resume) => ReactElement;
  renderPdf: (resume: Resume) => ReactElement;
}

export const templates: Record<string, Template> = {
  clean: { renderHtml: Clean.renderHtml, renderPdf: Clean.renderPdf },
  professional: { renderHtml: Professional.renderHtml, renderPdf: Professional.renderPdf },
  modern: { renderHtml: Modern.renderHtml, renderPdf: Modern.renderPdf },
};

export const templateList = Object.keys(templates);
