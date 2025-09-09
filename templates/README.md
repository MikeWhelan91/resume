# Template System

- Create `templates/<your-id>/template.json` with `{ id, name, engine: 'html'|'react-pdf' }`
- For HTML templates: add `template.html` and `style.css`; use Mustache placeholders from `TemplateModel` (see `lib/templateModel.js`).
- For React-PDF templates: export `DocumentFor({ model })` from `index.jsx`.
- Run `npm run dev` or `npm run build`; the registry is auto-generated.
