import puppeteer from 'puppeteer'
import { getTemplate } from '@/templates'
import { toTemplateModel } from '@/lib/templateModel'
import { renderHtml } from '@/lib/renderHtmlTemplate'
import { getCurrentResumeData } from '@/lib/getCurrentResumeData'

export default async function handler(req, res) {
  const templateId = (req.query.template || '').toString()
  const accent = (req.query.accent || '#10b39f').toString()
  const density = (req.query.density || 'Normal').toString()
  const ats = req.query.ats === '1'

  const tpl = getTemplate(templateId)
  const appData = await getCurrentResumeData(req)
  const baseModel = toTemplateModel(appData, { ats, density })
  const model = { ...baseModel, isCoverLetter: true }

  const html = renderHtml({ html: tpl.html, css: tpl.css, model, options:{ mode:'print', accent, density, ats } })

  const browser = await puppeteer.launch({ headless:'new' })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil:'networkidle0' })
  await page.emulateMediaType('print')

  const pdf = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top:'0', right:'0', bottom:'0', left:'0' }
  })

  await browser.close()
  res.setHeader('Content-Type','application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${templateId || 'cover-letter'}.pdf"`)
  res.end(pdf)
}
