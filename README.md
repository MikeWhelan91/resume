# TailorCV (resume)
Quickstart:
- `npm install`
- Set `OPENAI_API_KEY` in your env
- `npm run dev`

Notes:
- You can upload an existing CV or build one from scratch in the in-browser wizard.
- Uploaded files are parsed to prefill the wizard; nothing is stored on the server.
- 20MB upload limit; supported: PDF, DOCX, TXT.
- API is rate-limited (10 req/min/IP).
- Generated resumes only include skills, titles, and locations that appear in your provided resume data.
 - Cross-references job description skills with your resume so cover letters only mention verified abilities and highlight willingness to learn any missing skills.

## Export
- PDF export uses @react-pdf/renderer for vector, selectable-text PDFs.
- DOCX export unchanged.
- HTML preview rebuilt for reliability.
 - Multi-page PDF export supported.
