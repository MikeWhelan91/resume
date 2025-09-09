import type { NextApiRequest, NextApiResponse } from 'next'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isLocal = !process.env.VERCEL
  const executablePath = isLocal
          ? (process.platform === 'win32'
              ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
              : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    : await chromium.executablePath()

  const browser = await puppeteer.launch({
    args: chromium.args,
    headless: 'new',
    executablePath,
    defaultViewport: chromium.defaultViewport
  })

  try {
    const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http'
    const host = req.headers.host
    const url = `${proto}://${host}/results?print=1`
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 })
    await page.emulateMediaType('screen')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' }
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"')
    res.send(pdf)
  } finally {
    await browser.close()
  }
}
