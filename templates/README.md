# Template System

- Create `templates/<your-id>/template.json` with `{ id, name, engine: 'html' }`
- Add `template.html` and `style.css`; use Mustache placeholders from `TemplateModel` (see `lib/templateModel.js`).
- Run `npm run dev` or `npm run build`; the registry is auto-generated.
