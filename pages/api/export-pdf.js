import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";

import Classic from "../../components/templates/Classic";
import TwoCol from "../../components/templates/TwoCol";
import Centered from "../../components/templates/Centered";
import Sidebar from "../../components/templates/Sidebar";
import Modern from "../../components/templates/Modern";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

const TEMPLATE_MAP = {
  classic: Classic,
  twocol: TwoCol,
  centered: Centered,
  sidebar: Sidebar,
  modern: Modern,
};

async function launchBrowser() {
  // Try Vercel/serverless first (puppeteer-core + chrome-aws-lambda), then local/dev fallback
  try {
    const chromium = (await import("chrome-aws-lambda")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    const executablePath = await chromium.executablePath;
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      defaultViewport: { width: 1240, height: 1754 }, // ~A4 @ 96dpi
    });
  } catch {
    const puppeteer = (await import("puppeteer")).default;
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1240, height: 1754 },
    });
  }
}

function readIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return ""; }
}

const INLINED_CSS = [
  path.join(process.cwd(), "styles", "globals.css"),
  path.join(process.cwd(), "styles", "resume.css"),
].map(readIfExists).join("\n");

/** Build a full HTML doc around a given template */
function renderHtml({ data, template = "classic", mode = "ats", accent = '#1a73e8', density = 'normal' }) {
  const Comp = TEMPLATE_MAP[String(template).toLowerCase()] || Classic;
  const densityVars = {
    compact: ['11px','1.5'],
    normal: ['12.5px','1.75'],
    cozy: ['14px','1.9']
  };
  const [fontSize, lineHeight] = densityVars[density] || densityVars.normal;
  const body = ReactDOMServer.renderToStaticMarkup(<Comp data={data || {}} />);

  // ATS mode: enforce monochrome, remove backgrounds/shadows; keep colors in design mode
  const atsCss = `
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ats-mode .resume * { color:#000 !important; background:none !important; box-shadow:none !important; }
.ats-mode .resume a { color:#000 !important; text-decoration:none; }
.ats-mode .resume [data-paper] { border:none !important; }
.ats-mode .resume .pill { border:1px solid #000 !important; background:none !important; }
`.trim();

  const styleVars = `--accent:${accent};--font-size:${fontSize};--line-height:${lineHeight};`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${INLINED_CSS}\n.paper{height:auto !important;overflow:visible !important;}\n/* --- ATS overrides --- */\n${atsCss}</style>
</head>
<body class="${mode === "ats" ? "ats-mode" : ""}">
  <div class="paper" style="${styleVars}">${body}</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { data, template = "classic", mode = "ats", accent = '#1a73e8', density = 'normal', filename = "resume" } =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!data || !data.name) return res.status(400).json({ error: "Missing resume data (data.name required)" });

    const html = renderHtml({ data, template, mode, accent, density });

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    // Use screen media so PDF mirrors on-screen rendering (avoids print-specific layout overrides)
    await page.emulateMediaType('screen');
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });
    await page.close();
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${String(filename).replace(/"/g, "")}.pdf"`);
    return res.send(Buffer.from(pdf));
  } catch (e) {
    console.error("[export-pdf] error:", e);
    return res.status(500).json({ error: "Failed to generate PDF", detail: String(e?.message || e) });
  }
}
