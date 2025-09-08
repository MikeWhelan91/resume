import puppeteer from "puppeteer";

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { html } = req.body || {};
  if (!html || typeof html !== "string" || html.length < 50) {
    return res.status(400).json({ error: "Missing or invalid HTML" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new"
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" }
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="document.pdf"');
    return res.send(pdf);
  } catch (e) {
    try { if (browser) await browser.close(); } catch {}
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
