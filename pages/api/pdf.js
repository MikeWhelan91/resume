import puppeteer from 'puppeteer'
import { getTemplate } from '@/templates'
import { toTemplateModel } from '@/lib/templateModel'
import { renderHtml } from '@/lib/renderHtmlTemplate'
import { getCurrentResumeData } from '@/lib/getCurrentResumeData'

export default async function handler(req, res) {
  const templateId = (req.query.template || '').toString()
  const tpl = getTemplate(templateId)
  const appData = await getCurrentResumeData(req)
  const model = toTemplateModel(appData)
  if (appData.coverLetter) model.coverLetter = appData.coverLetter
  if (appData.isCoverLetter) model.isCoverLetter = true
  const html = renderHtml({ html: tpl.html, css: tpl.css, model })

  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.emulateMediaType('screen')
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  })
  await browser.close()

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${templateId || 'resume'}.pdf"`)
  res.end(pdf)
}
