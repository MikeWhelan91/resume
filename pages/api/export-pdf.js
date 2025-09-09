export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

let ACTIVE = 0;
const MAX_CONCURRENCY = 2; // keep small for CPU and memory

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Simple concurrency gate (production: move to a queue/job runner)
  if (ACTIVE >= MAX_CONCURRENCY) return res.status(429).json({ error: "Server busy, try again" });
  ACTIVE++;

  const puppeteer = (await import("puppeteer")).default;
  const { data, doc = "resume", html } = req.body || {};
  const origin = req.headers.origin || process.env.PUBLIC_ORIGIN || "http://localhost:3000";

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    if (html) {
      // Direct HTML snapshot (client sends)
      const withBase = html.includes("<base")
        ? html
        : html.replace("<head>", `<head><base href="${origin}">`);
      await page.setContent(withBase, { waitUntil: "networkidle0" });
    } else {
      // Server recreates your UI flow and injects the same data the UI uses
      await page.goto(origin, { waitUntil: "domcontentloaded" });

      await page.evaluate((payload) => {
        try { localStorage.setItem("resumeResult", JSON.stringify(payload)); } catch {}
      }, data || null);

      const url = `${origin}/results?print=1&doc=${encodeURIComponent(doc)}`;
      await page.goto(url, { waitUntil: "networkidle0" });
    }

    // Fonts & layout readiness
    await page.evaluate(() => (document.fonts && document.fonts.ready) ? document.fonts.ready.then(() => true) : true);

    // Wait until printable content exists and has geometry
    const SELECTORS = ["#print-root .paper", "#resume-preview .paper", "#cover-preview .paper", ".paper"];
    await page.waitForFunction((sels) => sels.some(s => document.querySelector(s)), { timeout: 15000 }, SELECTORS);
    await page.waitForFunction(() => {
      const el = document.querySelector("#print-root .paper") || document.querySelector(".paper");
      return !!el && el.clientHeight > 0 && el.clientWidth > 0;
    }, { timeout: 15000 });

    // Print with CSS page size (honor @page)
    await page.emulateMediaType("print");
    const pdfBuf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // honor @page { size: A4 }
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1
    });

    const body = Buffer.isBuffer(pdfBuf) ? pdfBuf : Buffer.from(pdfBuf);
    await browser.close();

    // Return with explicit length to avoid truncation by proxies/CDNs
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc}.pdf"`);
    res.setHeader("Content-Length", String(body.length));
    res.setHeader("Cache-Control", "no-store");
    res.end(body);
  } catch (err) {
    try { if (browser) await browser.close(); } catch {}
    res.status(500).json({ error: String(err?.message || err) });
  } finally {
    ACTIVE--;
  }
}

