export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const puppeteer = (await import("puppeteer")).default;
  const { html } = req.body || {};
  if (!html || typeof html !== "string" || html.length < 50) {
    return res.status(400).json({ error: "Missing or invalid HTML" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Let CSS (@page size: A4) dictate final page size:
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,     // <— trust @page size
      margin: { top: 0, right: 0, bottom: 0, left: 0 }, // no extra margins
      scale: 1                     // do NOT downscale
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
