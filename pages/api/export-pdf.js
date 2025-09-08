export const config = { api: { bodyParser: { sizeLimit: "3mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const puppeteer = (await import("puppeteer")).default;
  const { data, doc = "resume" } = req.body || {}; // data = the object you store in localStorage["resumeResult"]

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

    // 1) Bootstrap an origin context so we can set localStorage for that origin.
    await page.goto(origin, { waitUntil: "domcontentloaded" });

    // 2) Inject the same data the UI uses
    await page.evaluate((payload) => {
      try { localStorage.setItem("resumeResult", JSON.stringify(payload)); } catch (e) {}
    }, data || null);

    // 3) Navigate to the real results page in print mode (loads Tailwind + fonts)
    const url = `${origin}/results?print=1&doc=${encodeURIComponent(doc)}`;
    await page.goto(url, { waitUntil: "networkidle0" });

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
