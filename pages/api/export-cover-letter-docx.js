import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { limitCoverLetter } from "../../lib/renderUtils.js";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getUserEntitlement } from '../../lib/credit-purchase-system';
import { getEffectivePlan } from '../../lib/credit-system';
import { checkAndConsumeDownload, trackApiUsage } from '../../lib/credit-purchase-system';
import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userData, accent = '#2563eb' } = req.body;

    if (!userData) {
      return res.status(400).json({ error: "No user data provided" });
    }

    // Get user session and entitlement
    let userPlan = 'standard';
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

    // DOCX is available for Pro plans only
    if (!String(userPlan || '').startsWith('pro')) {
      return res.status(402).json({
        error: 'Upgrade required',
        message: 'DOCX downloads are only available for Pro users. Upgrade to access this feature.'
      });
    }

    // Check per-document download limits for authenticated users
    if (userId) {
      // Find the user's latest saved resume for download tracking
      const latestResume = await prisma.savedResume.findFirst({
        where: {
          userId,
          isLatest: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (latestResume) {
        const downloadCheck = await checkAndConsumeDownload(userId, latestResume.id);
        if (!downloadCheck.allowed) {
          return res.status(429).json({
            error: 'Download limit reached',
            message: downloadCheck.message,
            downloadsRemaining: downloadCheck.downloadsRemaining || 0
          });
        }
      }
    }

    const scale = 1.4; // Use 1.4x scaling for optimal DOCX readability
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const children = [];

    // Date (right aligned)
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: today,
            size: Math.round(9 * scale * 2), // 9px * 1.75 * 2 (docx uses half-points)
            color: "666666"
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: Math.round(15 * scale * 20) } // Convert to twentieths of a point
      })
    );

    // Cover letter content
    if (userData.coverLetter) {
      const paragraphs = limitCoverLetter(userData.coverLetter);
      
      paragraphs.forEach((paragraph, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: Math.round(9 * scale * 2)
              })
            ],
            spacing: { 
              after: index < paragraphs.length - 1 ? Math.round(8 * scale * 20) : Math.round(20 * scale * 20)
            },
            alignment: AlignmentType.JUSTIFIED
          })
        );
      });
    } else {
      // Default cover letter content
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Dear Hiring Manager,",
              size: Math.round(9 * scale * 2)
            })
          ],
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "I am writing to express my interest in the position at your company. With my background and experience, I believe I would be a valuable addition to your team.",
              size: Math.round(9 * scale * 2)
            })
          ],
          spacing: { after: Math.round(8 * scale * 20) },
          alignment: AlignmentType.JUSTIFIED
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Thank you for considering my application. I look forward to hearing from you.",
              size: Math.round(9 * scale * 2)
            })
          ],
          spacing: { after: Math.round(20 * scale * 20) },
          alignment: AlignmentType.JUSTIFIED
        })
      );
    }

    // Closing
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Sincerely,",
            size: Math.round(9 * scale * 2)
          })
        ],
        spacing: { after: Math.round(15 * scale * 20) }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData?.name || userData.name || 'Your Name',
            bold: true,
            size: Math.round(9 * scale * 2)
          })
        ]
      })
    );

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,  // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720    // 0.5 inch
            }
          }
        },
        children: children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    
    // Track usage after successful generation
    if (userId) {
      await trackApiUsage(userId, 'docx-download');
    }
    
    const fileName = `${(userData.resumeData?.name || userData.name || 'cover_letter').replace(/\s+/g, '_')}_cover_letter.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(buffer);
  } catch (error) {
    console.error('Cover letter DOCX generation error:', error);
    return res.status(500).json({ error: "Failed to generate cover letter DOCX file" });
  }
}
