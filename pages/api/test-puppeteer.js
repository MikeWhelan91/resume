import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing Puppeteer launch...');

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu"
      ],
      defaultViewport: { width: 1240, height: 1754 },
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();
    console.log('Page created');

    await page.setContent('<html><body><h1>Test PDF</h1></body></html>');
    console.log('Content set');

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    console.log('PDF generated, size:', pdf.length);

    await page.close();
    await browser.close();
    console.log('Browser closed');

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=test.pdf");
    return res.send(pdf);

  } catch (error) {
    console.error('Puppeteer test error:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Puppeteer test failed',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}