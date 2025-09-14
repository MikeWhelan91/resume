  import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import puppeteer from "puppeteer";

import ResumeTemplate from "../../components/ResumeTemplate";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

const TEMPLATE_MAP = {
  classic: 'professional',
  twocol: 'twocolumn',
  centered: 'minimal',
  sidebar: 'twocolumn',
  modern: 'modern',
  professional: 'professional',
  creative: 'creative',
  minimal: 'minimal',
  twocolumn: 'twocolumn',
  executive: 'executive',
};

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1240, height: 1754 },
  });
}

function readIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return ""; }
}

const INLINED_CSS = [
  path.join(process.cwd(), "styles", "globals.css"),
  path.join(process.cwd(), "styles", "resume.css"),
].map(readIfExists).join("\n");

/** Build a full HTML doc around a given template */
function renderHtml({ data, template = "classic", mode = "ats" }) {
  const templateName = TEMPLATE_MAP[String(template).toLowerCase()] || 'professional';
  const body = ReactDOMServer.renderToStaticMarkup(
    <ResumeTemplate 
      userData={data || {}} 
      template={templateName} 
      accent="#2563eb" 
      isPDF={true}
      userPlan="pro"
    />
  );

  // ATS mode: enforce monochrome, remove backgrounds/shadows; print-safe
  const atsCss = `
@media print {
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
.ats-mode .resume * { color:#000 !important; background:none !important; box-shadow:none !important; }
.ats-mode .resume a { color:#000 !important; text-decoration:none; }
.ats-mode .resume [data-paper] { border:none !important; }
.ats-mode .resume .pill { border:1px solid #000 !important; background:none !important; }
`.trim();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${INLINED_CSS}\n/* --- ATS overrides --- */\n${atsCss}</style>
</head>
<body class="${mode === "ats" ? "ats-mode" : ""}">
  <div id="root"><div class="resume">${body}</div></div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { data, template = "classic", mode = "ats", filename = "resume" } =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!data || !data.name) return res.status(400).json({ error: "Missing resume data (data.name required)" });

    const html = renderHtml({ data, template, mode });

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
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
