import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getUserEntitlement } from '../../lib/entitlements';
import { getEffectivePlan, checkCreditAvailability, consumeCredit, trackApiUsage } from '../../lib/credit-system';

function h(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}
function p(text){ return new Paragraph({ children:[new TextRun(text)] }); }
function bullet(text){ return new Paragraph({ text, bullet: { level: 0 } }); }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { data, filename = "resume" } = body;
    if (!data || !data.name) return res.status(400).json({ error: "Missing data" });

    // Get user session and entitlement
    let userPlan = 'free';
    let userId = null;
    try {
      const session = await getServerSession(req, res, authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
        const entitlement = await getUserEntitlement(session.user.id);
        userPlan = getEffectivePlan(entitlement);
      }
    } catch (error) {
      console.error('Error fetching user entitlement:', error);
    }

    // DOCX is not available for free users
    if (userPlan === 'free') {
      return res.status(402).json({ 
        error: 'Upgrade required',
        message: 'DOCX downloads are only available for Pro users. Upgrade to access this feature.'
      });
    }

    // Check credit availability for downloads
    if (userId) {
      const creditCheck = await checkCreditAvailability(userId, 'download');
      if (!creditCheck.allowed) {
        return res.status(429).json({ 
          error: 'Limit exceeded', 
          message: creditCheck.message,
          credits: creditCheck.credits,
          plan: creditCheck.plan
        });
      }
    }

    const docChildren = [];
    // Header
    docChildren.push(new Paragraph({ children: [new TextRun({ text: data.name, bold: true, size: 28 })] }));
    const meta = [data.title, data.location].filter(Boolean).join(" • ");
    if (meta) docChildren.push(p(meta));
    const contacts = [data.email, data.phone, ...(data.links || []).map((l) => l.url)].filter(Boolean).join(" · ");
    if (contacts) docChildren.push(p(contacts));

    if (data.summary) { docChildren.push(h("Profile")); docChildren.push(p(data.summary)); }
    if (Array.isArray(data.skills) && data.skills.length) {
      docChildren.push(h("Skills"));
      docChildren.push(p(data.skills.join(", ")));
    }

    docChildren.push(h("Experience"));
    (data.experience || []).forEach((x) => {
      const heading = `${x.company} — ${x.title}`;
      const dates = `${x.start} – ${x.end || "Present"}`;
      docChildren.push(new Paragraph({ children: [
        new TextRun({ text: heading, bold: true }),
        new TextRun({ text: `   ${dates}`, italics: true }),
      ]}));
      (x.bullets || []).forEach((b) => docChildren.push(bullet(b)));
    });

    if (Array.isArray(data.education) && data.education.length) {
      docChildren.push(h("Education"));
      data.education.forEach((e) => {
        docChildren.push(new Paragraph({ children: [
          new TextRun({ text: `${e.school} — ${e.degree}`, bold: true }),
          new TextRun({ text: `   ${e.start} – ${e.end}`, italics: true }),
        ]}));
      });
    }

    const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
    const buffer = await Packer.toBuffer(doc);

    // Track usage and consume credit after successful generation
    if (userId) {
      await consumeCredit(userId, 'download');
      await trackApiUsage(userId, 'docx-download');
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${String(filename).replace(/"/g, "")}.docx"`);
    return res.send(Buffer.from(buffer));
  } catch (e) {
    return res.status(500).json({ error: "Export failed", detail: String(e?.message || e) });
  }
}
