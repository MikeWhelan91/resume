/* If this file exists, adjust options; otherwise create similar to below */
import chromium from 'chrome-aws-lambda'; // or puppeteer if you already use it
import { getTemplate } from '../../templates';
import { renderHtml } from '../../lib/renderHtmlTemplate';
import { toTemplateModel } from '../../lib/templateModel';

export default async function handler(req, res){
  try{
    const { template:id, accent='#10b39f', density='Normal', ats='0' } = req.query;
    const tpl = getTemplate(id);
    const model = toTemplateModel(JSON.parse(req.cookies.resumeResult || '{}'), { ats: ats==='1', density });
    const html = renderHtml({ html: tpl.html, css: tpl.css, model, options:{ mode:'print', accent, density, ats: ats==='1' } });

    const executablePath = await chromium.executablePath;
    const puppeteer = await (executablePath ? import('puppeteer-core') : import('puppeteer'));
    const browser = await puppeteer.launch(executablePath ? {
      args: chromium.args, executablePath, headless: chromium.headless
    } : { headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil:'networkidle0' });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({ printBackground:true, preferCSSPageSize:true, margin:{top:'0', right:'0', bottom:'0', left:'0'} });
    await browser.close();

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="resume.pdf"');
    res.send(pdf);
  }catch(e){
    res.status(500).send('PDF error');
  }
}
