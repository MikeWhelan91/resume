import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import puppeteer from "puppeteer";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { checkTrialLimit, consumeTrialUsage } from '../../lib/trialUtils';

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
  try {
    const isWindows = process.platform === 'win32';
    const isDev = process.env.NODE_ENV === 'development';

    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor"
      ],
      defaultViewport: { width: 1240, height: 1754 },
    };

    // On Windows development, try to use system Chrome if available
    if (isWindows && isDev) {
      console.log('Windows development mode - trying system Chrome...');
      // Common Chrome locations on Windows
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.PUPPETEER_EXECUTABLE_PATH
      ].filter(Boolean);

      for (const path of possiblePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(path)) {
            console.log(`Found Chrome at: ${path}`);
            launchOptions.executablePath = path;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    console.log('Launching browser with options:', JSON.stringify(launchOptions, null, 2));
    return await puppeteer.launch(launchOptions);
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw new Error(`Browser launch failed: ${error.message}`);
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
  
  // Check authentication and trial limits
  let userId = null;
  let isTrialUser = false;
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Anonymous trial user - check trial limits
      isTrialUser = true;
      const trialCheck = await checkTrialLimit(req, 'export');
      if (!trialCheck.allowed) {
        return res.status(429).json({ 
          error: 'Trial export limit reached', 
          message: `Trial allows ${trialCheck.limit} PDF exports. Sign up for unlimited exports!`,
          code: 'TRIAL_EXPORT_LIMIT'
        });
      }
    }
  } catch (error) {
    console.error('Error checking authentication/trial limits:', error);
    // For security, fail closed if we can't verify permissions
    return res.status(500).json({ error: 'Unable to verify permissions' });
  }
  
  try {
    const { data, template = "classic", mode = "ats", filename = "resume" } =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!data || !data.name) return res.status(400).json({ error: "Missing resume data (data.name required)" });

    const html = renderHtml({ data, template, mode });

    let browser;
    let page;
    let pdf;

    try {
      browser = await launchBrowser();
      page = await browser.newPage();

      // Set content with longer timeout
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 30000
      });

      pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
        preferCSSPageSize: true,
      });

    } finally {
      // Ensure cleanup happens
      if (page) await page.close().catch(console.error);
      if (browser) await browser.close().catch(console.error);
    }

    // Consume trial usage for anonymous users after successful PDF generation
    if (isTrialUser) {
      try {
        await consumeTrialUsage(req, 'export');
      } catch (error) {
        console.error('Error tracking trial export usage:', error);
        // Don't block the response if tracking fails
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${String(filename).replace(/"/g, "")}.pdf"`);
    return res.send(Buffer.from(pdf));
  } catch (e) {
    console.error("[export-pdf] error:", e);
    console.error("[export-pdf] stack:", e.stack);

    // Detailed error for development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? String(e?.message || e)
      : 'PDF generation failed';

    console.error("[export-pdf] Sending error response:", { error: "Failed to generate PDF", detail: errorMessage });

    return res.status(500).json({
      error: "Failed to generate PDF",
      detail: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}
