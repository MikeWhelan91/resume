# TailorCV (resume)
## Quickstart

1. `npm install`
2. Set environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL_TAILOR` (default `gpt-4o-mini`)
   - `OPENAI_TEMPERATURE` (default `0.2`)
3. `npm run dev`

## Features

- **Two on-ramps** – upload an existing CV or build one from scratch.
- **Resume builder** – multi-step wizard with autosave to `localStorage`.
- **Template gallery** – live preview of Clean, Professional, and Modern templates and PDF export.
- **Tailoring** – paste a job description for coverage analysis, targeted CV rewrite, and cover letter generation.
- **ATS Scan** – toggle preview to view warnings for applicant tracking systems.

## Notes on Privacy

- Document text is never stored on the server; temporary files are deleted after processing.
- Local autosave is optional and stored only in your browser.
- API routes are rate-limited (10 req/min per IP).

## Export

- PDF export uses `@react-pdf/renderer` with embedded Inter fonts for selectable text.

