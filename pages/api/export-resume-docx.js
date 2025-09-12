import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { limitExperience, limitEducation } from "../../lib/renderUtils.js";
import { getServerSession } from 'next-auth/next';
import NextAuth from './auth/[...nextauth]';
import { getUserEntitlement } from '../../lib/entitlements';
import { checkUsageLimit, trackUsage } from '../../lib/usage-tracking';

// Helper function to safely get values
function safeProp(obj, path, fallback = '') {
  const value = path.split('.').reduce((o, p) => o && o[p], obj);
  return (value === null || value === undefined || value === 'null' || value === 'undefined') ? fallback : value;
}

const formatDate = (date) => {
  if (!date || date === 'null' || date === 'undefined') return 'Present';
  return date.toString().trim();
};

// Convert hex color to RGB object
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 37, g: 99, b: 235 }; // Default blue
}

function createProfessionalTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4; // Use 1.4x scaling for optimal DOCX readability
  
  const children = [];

  // Header with name and contact info
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(16 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Arial"
        })
      ],
      spacing: { after: Math.round(2 * scale * 20) }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666",
          font: "Arial"
        })
      ],
      spacing: { after: Math.round(12 * scale * 20) },
      border: {
        bottom: {
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          space: 1,
          size: Math.round(2 * scale),
          style: BorderStyle.SINGLE
        }
      }
    })
  );

  // Professional Summary
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL SUMMARY",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(9 * scale * 2),
            font: "Arial"
          })
        ],
        spacing: { after: Math.round(12 * scale * 20) },
        alignment: AlignmentType.JUSTIFIED
      })
    );
  }

  // Core Competencies - matching preview with individual skill tags
  if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CORE COMPETENCIES",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    // Display skills as individual items with spacing to simulate tags
    const skillsText = userData.resumeData.skills.join('   ');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skillsText,
            size: Math.round(8 * scale * 2),
            font: "Arial"
          })
        ],
        spacing: { after: Math.round(12 * scale * 20) }
      })
    );
  }

  // Professional Experience
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL EXPERIENCE",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      // Job title and company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title'),
              bold: true,
              size: Math.round(10 * scale * 2),
              font: "Arial"
            })
          ],
          spacing: { before: Math.round(6 * scale * 20), after: Math.round(3 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${safeProp(exp, 'company')} | ${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );

      // Bullet points
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `▪ ${bullet}`,
                  size: Math.round(8 * scale * 2),
                  font: "Arial"
                })
              ],
              spacing: { after: Math.round(2 * scale * 20) },
              indent: { left: Math.round(300 * scale) }
            })
          );
        });
      }
    });
  }

  // Education
  if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    limitEducation(userData.resumeData.education).forEach(edu => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
              bold: true,
              size: Math.round(9 * scale * 2),
              font: "Arial"
            })
          ],
          spacing: { before: Math.round(4 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${safeProp(edu, 'institution') || safeProp(edu, 'school')} | ${formatDate(edu.start)} - ${formatDate(edu.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );
    });
  }

  return children;
}

function createModernTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4; // Use 1.4x scaling for optimal DOCX readability
  const children = [];

  // Header with colored background (simulating gradient effect)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(18 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Segoe UI"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(8 * scale * 20), after: Math.round(4 * scale * 20) },
      shading: {
        fill: "F0F5FF"
      },
      indent: { left: Math.round(-200 * scale), right: Math.round(-200 * scale) }
    })
  );

  // Contact info within the header background
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666",
          font: "Segoe UI"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(12 * scale * 20) },
      shading: {
        fill: "F0F5FF"
      },
      indent: { left: Math.round(-200 * scale), right: Math.round(-200 * scale) }
    })
  );

  // About section with background color effect (using indentation and border)
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "ABOUT",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(9 * scale * 2)
          })
        ],
        spacing: { after: Math.round(12 * scale * 20) },
        indent: { left: Math.round(200 * scale), right: Math.round(200 * scale) },
        shading: {
          fill: "F8F9FA"
        },
        border: {
          left: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: Math.round(4 * scale),
            style: BorderStyle.SINGLE
          },
          top: {
            color: "F0F0F0",
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE
          },
          bottom: {
            color: "F0F0F0",
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE
          },
          right: {
            color: "F0F0F0",
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE
          }
        }
      })
    );
  }

  // Skills
  if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    userData.resumeData.skills.slice(0, 6).forEach(skill => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skill,
              size: Math.round(8 * scale * 2)
            })
          ],
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );
    });
  }

  // Education
  if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    limitEducation(userData.resumeData.education, 2).forEach(edu => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
              bold: true,
              size: Math.round(9 * scale * 2)
            })
          ],
          spacing: { after: Math.round(1 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
              size: Math.round(8 * scale * 2),
              color: "666666"
            })
          ],
          spacing: { after: Math.round(1 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );
    });
  }

  // Experience
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EXPERIENCE",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title'),
              bold: true,
              size: Math.round(10 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Helvetica"
            })
          ],
          spacing: { before: Math.round(6 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'company'),
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "Helvetica"
            })
          ],
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Helvetica"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `→ ${bullet}`,
                  size: Math.round(8 * scale * 2),
                  color: "555555",
                  font: "Helvetica"
                })
              ],
              spacing: { after: Math.round(2 * scale * 20) },
              indent: { left: Math.round(300 * scale) }
            })
          );
        });
      }
    });
  }

  return children;
}

function createCreativeTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4; // Use 1.4x scaling for optimal DOCX readability
  const children = [];

  // Header with creative styling
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(18 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Book Antiqua"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(6 * scale * 20) }
    })
  );

  // Decorative line under name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~",
          size: Math.round(8 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Book Antiqua"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(4 * scale * 20) }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(12 * scale * 20) }
    })
  );

  // Summary
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Profile",
            bold: true,
            italics: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(9 * scale * 2)
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(12 * scale * 20) },
        shading: {
          fill: "FAFAFA"
        },
        border: {
          top: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
          bottom: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
          left: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
          right: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE }
        },
        indent: { left: Math.round(200 * scale), right: Math.round(200 * scale) }
      })
    );
  }

  // Experience
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EXPERIENCE",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    // Decorative line under Experience header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "____",
            size: Math.round(8 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(6 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title'),
              bold: true,
              size: Math.round(11 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Georgia"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: Math.round(10 * scale * 20), after: Math.round(2 * scale * 20) },
          shading: {
            fill: "FAFAFA"
          },
          border: {
            top: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
            bottom: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
            left: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
            right: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE }
          }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'company'),
              size: Math.round(9 * scale * 2),
              color: "666666",
              italics: true,
              font: "Georgia"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: Math.round(2 * scale * 20) },
          shading: {
            fill: "FAFAFA"
          },
          border: {
            left: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
            right: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE }
          }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Georgia"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: Math.round(4 * scale * 20) },
          shading: {
            fill: "FAFAFA"
          },
          border: {
            left: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
            right: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE }
          }
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, index) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: Math.round(8 * scale * 2),
                  color: "555555",
                  font: "Georgia"
                })
              ],
              spacing: { after: Math.round(2 * scale * 20) },
              indent: { left: Math.round(360 * scale), right: Math.round(360 * scale) },
              shading: {
                fill: "FAFAFA"
              },
              border: {
                left: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
                right: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE },
                ...(index === exp.bullets.length - 1 && {
                  bottom: { color: "E0E0E0", size: 6, style: BorderStyle.SINGLE }
                })
              }
            })
          );
        });
      }
    });
  }

  // Skills (centered with decorative styling)
  if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Skills",
            bold: true,
            italics: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(2 * scale * 20) }
      })
    );

    // Decorative line under Skills header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "____",
            size: Math.round(8 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(6 * scale * 20) }
      })
    );

    const skillsText = userData.resumeData.skills.slice(0, 6).join(' • ');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skillsText,
            bold: true,
            size: Math.round(8 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(12 * scale * 20) }
      })
    );
  }

  // Education
  if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Education",
            bold: true,
            italics: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(2 * scale * 20) }
      })
    );

    // Decorative line under Education header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "____",
            size: Math.round(8 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(6 * scale * 20) }
      })
    );

    limitEducation(userData.resumeData.education, 1).forEach(edu => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
              bold: true,
              size: Math.round(9 * scale * 2),
              font: "Georgia"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: Math.round(4 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
              size: Math.round(8 * scale * 2),
              color: "666666",
              italics: true,
              font: "Georgia"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Georgia"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );
    });
  }

  return children;
}

function createMinimalTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4;
  const children = [];

  // Name (large, clean styling)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          size: Math.round(20 * scale * 2),
          color: "000000",
          font: "Calibri Light"
        })
      ],
      spacing: { after: Math.round(6 * scale * 20) }
    })
  );

  // Contact info with clean separator
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.email || userData.email || 'your.email@example.com',
          size: Math.round(10 * scale * 2),
          color: "666666",
          font: "Calibri"
        }),
        new TextRun({
          text: "  •  ",
          size: Math.round(10 * scale * 2),
          color: "CCCCCC",
          font: "Calibri"
        }),
        new TextRun({
          text: userData.resumeData?.phone || userData.phone || 'Your Phone',
          size: Math.round(10 * scale * 2),
          color: "666666",
          font: "Calibri"
        })
      ],
      spacing: { after: Math.round(20 * scale * 20) }
    })
  );

  // Summary
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(10 * scale * 2),
            color: "333333",
            font: "Arial"
          })
        ],
        spacing: { after: Math.round(16 * scale * 20) },
        alignment: AlignmentType.JUSTIFIED
      })
    );
  }

  // Experience
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EXPERIENCE",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: "000000",
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(16 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title'),
              bold: true,
              size: Math.round(11 * scale * 2),
              color: "000000",
              font: "Arial"
            }),
            new TextRun({
              text: `    ${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "Arial"
            })
          ],
          spacing: { before: Math.round(12 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'company'),
              size: Math.round(10 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: Math.round(9 * scale * 2),
                  color: "444444",
                  font: "Arial"
                })
              ],
              spacing: { after: Math.round(2 * scale * 20) },
              indent: { left: Math.round(200 * scale) }
            })
          );
        });
      }
    });
  }

  // Skills section with clean layout
  if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: "000000",
            font: "Calibri",
            smallCaps: true
          })
        ],
        spacing: { before: Math.round(16 * scale * 20), after: Math.round(6 * scale * 20) },
        border: {
          bottom: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: 3,
            style: BorderStyle.SINGLE
          }
        }
      })
    );

    // Display skills in a clean, readable format
    const skillsText = userData.resumeData.skills.join('  •  ');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skillsText,
            size: Math.round(9 * scale * 2),
            color: "333333",
            font: "Calibri"
          })
        ],
        spacing: { after: Math.round(16 * scale * 20) }
      })
    );
  }

  // Education
  if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: "000000",
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(16 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    limitEducation(userData.resumeData.education, 2).forEach(edu => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
              bold: true,
              size: Math.round(10 * scale * 2),
              color: "000000",
              font: "Arial"
            })
          ],
          spacing: { before: Math.round(8 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
              size: Math.round(8 * scale * 2),
              color: "999999",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );
    });
  }

  return children;
}

function createTwoColumnTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4;
  const children = [];

  // Create left column content (sidebar)
  const leftColumnContent = [];
  
  // Name and contact in left column
  leftColumnContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(16 * scale * 2),
          color: "FFFFFF",
          font: "Arial"
        })
      ],
      spacing: { after: Math.round(8 * scale * 20) }
    })
  );

  leftColumnContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.email || userData.email || 'your.email@example.com',
          size: Math.round(9 * scale * 2),
          color: "FFFFFF",
          font: "Arial"
        })
      ],
      spacing: { after: Math.round(4 * scale * 20) }
    })
  );

  leftColumnContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.phone || userData.phone || 'Your Phone',
          size: Math.round(9 * scale * 2),
          color: "FFFFFF",
          font: "Arial"
        })
      ],
      spacing: { after: Math.round(20 * scale * 20) }
    })
  );

  // Skills in left column
  if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
    leftColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: "FFFFFF",
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(10 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    userData.resumeData.skills.slice(0, 8).forEach(skill => {
      leftColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skill,
              size: Math.round(9 * scale * 2),
              color: "FFFFFF",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );
    });
  }

  // Education in left column
  if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
    leftColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: "FFFFFF",
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(15 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    limitEducation(userData.resumeData.education, 2).forEach(edu => {
      leftColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
              bold: true,
              size: Math.round(10 * scale * 2),
              color: "FFFFFF",
              font: "Arial"
            })
          ],
          spacing: { before: Math.round(8 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      leftColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
              size: Math.round(9 * scale * 2),
              color: "FFFFFF",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      leftColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
              size: Math.round(8 * scale * 2),
              color: "FFFFFF",
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(6 * scale * 20) }
        })
      );
    });
  }

  // Create right column content
  const rightColumnContent = [];

  // Summary in right column
  if (userData.resumeData?.summary) {
    rightColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL SUMMARY",
            bold: true,
            size: Math.round(14 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Arial"
          })
        ],
        spacing: { after: Math.round(8 * scale * 20) }
      })
    );

    rightColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(10 * scale * 2),
            color: "333333",
            font: "Arial"
          })
        ],
        spacing: { after: Math.round(15 * scale * 20) },
        alignment: AlignmentType.JUSTIFIED
      })
    );
  }

  // Experience in right column
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    rightColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL EXPERIENCE",
            bold: true,
            size: Math.round(14 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Arial"
          })
        ],
        spacing: { before: Math.round(10 * scale * 20), after: Math.round(12 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      rightColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title'),
              bold: true,
              size: Math.round(12 * scale * 2),
              color: "000000",
              font: "Arial"
            }),
            new TextRun({
              text: `    ${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "Arial"
            })
          ],
          spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
        })
      );

      rightColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'company'),
              bold: true,
              size: Math.round(11 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(6 * scale * 20) }
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          rightColumnContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `▸ ${bullet}`,
                  size: Math.round(9 * scale * 2),
                  color: "444444",
                  font: "Arial"
                })
              ],
              spacing: { after: Math.round(3 * scale * 20) },
              indent: { left: Math.round(200 * scale) }
            })
          );
        });
      }
    });
  }

  // Create the two-column table
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftColumnContent,
            width: {
              size: 35,
              type: WidthType.PERCENTAGE,
            },
            shading: {
              fill: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
            },
            margins: {
              top: Math.round(200 * scale),
              bottom: Math.round(200 * scale),
              left: Math.round(200 * scale),
              right: Math.round(200 * scale)
            },
            verticalAlign: "top"
          }),
          new TableCell({
            children: rightColumnContent,
            width: {
              size: 65,
              type: WidthType.PERCENTAGE,
            },
            margins: {
              top: Math.round(200 * scale),
              bottom: Math.round(200 * scale),
              left: Math.round(200 * scale),
              right: Math.round(200 * scale)
            },
            verticalAlign: "top"
          })
        ]
      })
    ],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    }
  });

  children.push(table);

  return children;
}

function createExecutiveTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4;
  const children = [];

  // Name (centered, large, executive styling)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (userData.resumeData?.name || userData.name || 'YOUR NAME').toUpperCase(),
          bold: true,
          size: Math.round(18 * scale * 2),
          color: "000000",
          font: "Times New Roman"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(12 * scale * 20) }
    })
  );

  // Decorative line under name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          size: Math.round(8 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Times New Roman"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(8 * scale * 20) }
    })
  );

  // Contact info (centered with professional separator)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.email || userData.email || 'your.email@example.com',
          size: Math.round(10 * scale * 2),
          color: "666666",
          font: "Times New Roman"
        }),
        new TextRun({
          text: "  |  ",
          size: Math.round(10 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Times New Roman"
        }),
        new TextRun({
          text: userData.resumeData?.phone || userData.phone || 'Your Phone',
          size: Math.round(10 * scale * 2),
          color: "666666",
          font: "Times New Roman"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(25 * scale * 20) }
    })
  );

  // Executive Summary
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EXECUTIVE SUMMARY",
            bold: true,
            size: Math.round(14 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Times"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(25 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    // Top border line
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            size: Math.round(6 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Times New Roman"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(8 * scale * 20) }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(11 * scale * 2),
            color: "000000",
            italics: true,
            font: "Times New Roman"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(8 * scale * 20) },
        indent: { left: Math.round(720 * scale), right: Math.round(720 * scale) }
      })
    );

    // Bottom border line
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            size: Math.round(6 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Times New Roman"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(20 * scale * 20) }
      })
    );
  }

  // Professional Experience
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL EXPERIENCE",
            bold: true,
            size: Math.round(14 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Times"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(25 * scale * 20), after: Math.round(12 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title').toUpperCase(),
              bold: true,
              size: Math.round(12 * scale * 2),
              color: "000000",
              font: "Times"
            }),
            new TextRun({
              text: `    ${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              bold: true,
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "Times"
            })
          ],
          spacing: { before: Math.round(15 * scale * 20), after: Math.round(6 * scale * 20) },
          shading: {
            fill: "FAFAFA"
          },
          border: {
            top: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE },
            bottom: {
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              space: 1,
              size: 3,
              style: BorderStyle.SINGLE
            },
            left: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE },
            right: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE }
          }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'company'),
              bold: true,
              size: Math.round(11 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              italics: true,
              font: "Times"
            })
          ],
          spacing: { after: Math.round(6 * scale * 20) },
          shading: {
            fill: "FAFAFA"
          },
          border: {
            left: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE },
            right: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE }
          }
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, index) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `► ${bullet}`,
                  size: Math.round(9 * scale * 2),
                  color: "333333",
                  font: "Times"
                })
              ],
              spacing: { after: Math.round(3 * scale * 20) },
              indent: { left: Math.round(360 * scale) },
              alignment: AlignmentType.JUSTIFIED,
              shading: {
                fill: "FAFAFA"
              },
              border: {
                left: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE },
                right: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE },
                ...(index === exp.bullets.length - 1 && {
                  bottom: { color: "E0E0E0", space: 1, size: 6, style: BorderStyle.SINGLE }
                })
              }
            })
          );
        });
      }
    });
  }

  // Core Competencies
  if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CORE COMPETENCIES",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Times"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(20 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    const skillsText = userData.resumeData.skills.slice(0, 8).join(' | ');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skillsText,
            size: Math.round(9 * scale * 2),
            color: "333333",
            font: "Times"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(20 * scale * 20) },
        border: {
          top: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE
          },
          bottom: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE
          }
        }
      })
    );
  }

  // Education
  if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Times"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: Math.round(20 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    limitEducation(userData.resumeData.education, 2).forEach(edu => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
              bold: true,
              size: Math.round(10 * scale * 2),
              color: "000000",
              font: "Times"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: Math.round(8 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
              bold: true,
              size: Math.round(9 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Times"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Times"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );
    });
  }

  return children;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userData, template = 'professional', accent = '#2563eb' } = req.body;

    if (!userData) {
      return res.status(400).json({ error: "No user data provided" });
    }

    // Get user session and entitlement
    let userPlan = 'free';
    let userId = null;
    try {
      const session = await getServerSession(req, res, NextAuth);
      if (session?.user?.id) {
        userId = session.user.id;
        const entitlement = await getUserEntitlement(userId);
        userPlan = entitlement.plan;
      }
    } catch (error) {
      console.error('Error fetching user entitlement:', error);
    }

    // DOCX is not available for free users
    if (userPlan === 'free') {
      return res.status(402).json({ 
        error: 'Upgrade required',
        message: 'DOCX export is only available for Pro users. Please upgrade your plan.'
      });
    }

    // Check usage limits for Pro users
    if (userId) {
      const usageCheck = await checkUsageLimit(userId, 'docx-download', userPlan);
      if (!usageCheck.allowed) {
        return res.status(429).json({ 
          error: 'Usage limit exceeded', 
          message: usageCheck.message,
          usage: usageCheck.usage,
          limit: usageCheck.limit 
        });
      }
    }

    // Free users can only use Professional template and default color
    const effectiveTemplate = userPlan === 'free' ? 'professional' : template;
    const effectiveAccent = userPlan === 'free' ? '#10b39f' : accent;

    let documentChildren;
    
    switch (effectiveTemplate) {
      case 'modern':
        documentChildren = createModernTemplate(userData, effectiveAccent);
        break;
      case 'creative':
        documentChildren = createCreativeTemplate(userData, effectiveAccent);
        break;
      case 'minimal':
        documentChildren = createMinimalTemplate(userData, effectiveAccent);
        break;
      case 'two-column':
        documentChildren = createTwoColumnTemplate(userData, effectiveAccent);
        break;
      case 'executive':
        documentChildren = createExecutiveTemplate(userData, effectiveAccent);
        break;
      case 'professional':
      default:
        documentChildren = createProfessionalTemplate(userData, effectiveAccent);
        break;
    }

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
        children: documentChildren
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    
    const fileName = `${(userData.resumeData?.name || userData.name || 'resume').replace(/\s+/g, '_')}_resume.docx`;
    
    // Track usage after successful generation
    if (userId) {
      await trackUsage(userId, 'docx-download');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(buffer);
  } catch (error) {
    console.error('DOCX generation error:', error);
    return res.status(500).json({ error: "Failed to generate DOCX file" });
  }
}