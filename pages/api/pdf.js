import { chromium } from 'playwright';
import { getTemplate } from '../../templates';
import { renderHtml } from '../../lib/renderHtmlTemplate';
import { toTemplateModel } from '../../lib/templateModel';

export default async function handler(req, res){
  try{
    const { template:id, accent='#10b39f', density='normal', ats='0' } = req.query;
    const tpl = getTemplate(id);
    const data = JSON.parse(req.cookies.resumeResult || '{}');
    const model = toTemplateModel(data, { ats: ats==='1', density, isCoverLetter:false });
    const html = renderHtml({ html: tpl?.html || '<main></main>', css: tpl?.css || '', model, options:{ mode:'print', accent, density:model.density, ats: ats==='1' } });

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil:'networkidle' });
    const pdf = await page.pdf({ format:'A4', printBackground:true, preferCSSPageSize:true,
      margin:{ top:'14mm', right:'14mm', bottom:'14mm', left:'14mm' } });
    await browser.close();

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="resume.pdf"');
    res.send(pdf);
  }catch(e){
    res.status(500).send('PDF error');
  }
}
