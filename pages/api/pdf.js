import { getTemplate } from '@/templates'
import { toTemplateModel } from '@/lib/templateModel'
import { renderHtml } from '@/lib/renderHtmlTemplate'
import { renderReactPdf } from '@/lib/renderReactPdf'
import puppeteer from 'puppeteer'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end()
  const templateId = (req.query.template || '').toString()
  const t = getTemplate(templateId)

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const appData = body.data || {}
  const model = toTemplateModel(appData)

  let pdfBuffer
  if (t.engine === 'html'){
    const html = renderHtml({ html: t.html, css: t.css, model })
    const browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('screen')
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top:'18mm', right:'16mm', bottom:'18mm', left:'16mm' }
    })
    await browser.close()
  } else {
    pdfBuffer = await renderReactPdf({ module: t.module, model })
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${templateId || 'resume'}.pdf"`)
  res.send(pdfBuffer)
}
