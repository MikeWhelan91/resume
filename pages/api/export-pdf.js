export const config = { api: { bodyParser: { sizeLimit: "3mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const puppeteer = (await import("puppeteer")).default;
  const { data, doc = "resume", html } = req.body || {}; // data = the object you store in localStorage["resumeResult"]

  const origin =
    req.headers.origin ||
    process.env.PUBLIC_ORIGIN ||
    "http://localhost:3000";

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    if (html) {
      // Render provided HTML directly; ensure relative assets resolve against origin
      const markup = html.includes('<base')
        ? html
        : html.replace('<head>', `<head><base href="${origin}">`);
      await page.setContent(markup, { waitUntil: "networkidle0" });

    } else {
      // 1) Bootstrap an origin context so we can set localStorage for that origin.
      await page.goto(origin, { waitUntil: "domcontentloaded" });

      // 2) Inject the same data the UI uses
      await page.evaluate((payload) => {
        try { localStorage.setItem("resumeResult", JSON.stringify(payload)); } catch (e) {}
      }, data || null);

      // 3) Navigate to the real results page in print mode (loads Tailwind + fonts)
      const url = `${origin}/results?print=1&doc=${encodeURIComponent(doc)}`;
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.waitForSelector("#print-root .paper", { timeout: 10000 });
    }

    // Remove Next.js FOUC-hiding styles and ensure visibility
    await page.evaluate(() => {
      const fouc = document.querySelector('style[data-next-hide-fouc]');
      if (fouc) fouc.remove();
      const nos = document.querySelector('noscript[data-n-css]');
      if (nos) nos.remove();
      document.body && (document.body.style.visibility = 'visible');
    });

    await page.waitForSelector('#print-root .paper', { timeout: 10000 });

    // Ensure all web fonts are loaded before exporting
    await page.evaluate(() => document.fonts.ready);

    // Ensure the target content actually rendered
    await page.waitForFunction(() => {
      const el = document.querySelector('#print-root .paper');
      return !!el && el.clientHeight > 0;
    }, { timeout: 10000 });


    // 4) Use print media and trust CSS @page sizing
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc}.pdf"`);
    return res.send(pdf);
  } catch (e) {
    try { if (browser) await browser.close(); } catch {}
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
