import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { limitExperience, limitEducation } from "../../lib/renderUtils.js";
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getUserEntitlement } from '../../lib/entitlements';
import { getEffectivePlan, checkCreditAvailability, consumeCredit, trackApiUsage } from '../../lib/credit-system';

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

    // Display skills with better spacing to simulate tags
    userData.resumeData.skills.forEach((skill, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skill,
              size: Math.round(8 * scale * 2),
              font: "Arial"
            })
          ],
          spacing: { after: Math.round(2 * scale * 20) },
          shading: {
            fill: "F0F0F0"
          },
          indent: { left: Math.round(10 * scale * 20), right: Math.round(10 * scale * 20) }
        })
      );
    });
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

  // Header with light blue background to simulate gradient
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(16 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Helvetica"
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: Math.round(6 * scale * 20), after: Math.round(2 * scale * 20) },
      shading: {
        fill: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}20`
      },
      indent: { left: Math.round(12 * scale * 20), right: Math.round(12 * scale * 20) },
      border: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE }
      }
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
          font: "Helvetica"
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: Math.round(12 * scale * 20) },
      shading: {
        fill: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}15`
      },
      indent: { left: Math.round(12 * scale * 20), right: Math.round(12 * scale * 20) }
    })
  );

  // About section with left border accent
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "About",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Helvetica"
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
            font: "Helvetica"
          })
        ],
        spacing: { after: Math.round(12 * scale * 20) },
        indent: { left: Math.round(8 * scale * 20), right: Math.round(8 * scale * 20) },
        shading: {
          fill: "FAFAFA"
        },
        border: {
          left: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: Math.round(4 * scale),
            style: BorderStyle.SINGLE
          },
          top: {
            color: "E0E0E0",
            space: 1,
            size: 4,
            style: BorderStyle.SINGLE
          },
          bottom: {
            color: "E0E0E0",
            space: 1,
            size: 4,
            style: BorderStyle.SINGLE
          },
          right: {
            color: "E0E0E0",
            space: 1,
            size: 4,
            style: BorderStyle.SINGLE
          }
        }
      })
    );
  }

  // Skills and Education Side-by-Side (using table to match PDF layout)
  if ((userData.resumeData?.skills && userData.resumeData.skills.length > 0) ||
      (userData.resumeData?.education && userData.resumeData.education.length > 0)) {

    // Create skills column content
    const skillsContent = [];
    if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
      skillsContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Skills",
              bold: true,
              size: Math.round(11 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Helvetica"
            })
          ],
          spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
        })
      );

      // Add skills with tag-like styling (using shading to simulate background)
      userData.resumeData.skills.slice(0, 6).forEach(skill => {
        skillsContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: skill,
                size: Math.round(8 * scale * 2),
                font: "Helvetica"
              })
            ],
            spacing: { after: Math.round(2 * scale * 20) },
            shading: {
              fill: "F0F0F0"
            },
            indent: { left: Math.round(2 * scale * 20), right: Math.round(2 * scale * 20) }
          })
        );
      });
    }

    // Create education column content
    const educationContent = [];
    if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
      educationContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Education",
              bold: true,
              size: Math.round(11 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "Helvetica"
            })
          ],
          spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
        })
      );

      limitEducation(userData.resumeData.education, 2).forEach(edu => {
        educationContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
                bold: true,
                size: Math.round(9 * scale * 2),
                font: "Helvetica"
              })
            ],
            spacing: { after: Math.round(1 * scale * 20) }
          })
        );

        educationContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
                size: Math.round(8 * scale * 2),
                color: "666666",
                font: "Helvetica"
              })
            ],
            spacing: { after: Math.round(1 * scale * 20) }
          })
        );

        educationContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
                size: Math.round(8 * scale * 2),
                color: "666666",
                font: "Helvetica"
              })
            ],
            spacing: { after: Math.round(6 * scale * 20) }
          })
        );
      });
    }

    // Create two-column table to match PDF layout
    const skillsEducationTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: skillsContent.length > 0 ? skillsContent : [new Paragraph("")],
              width: { size: 4500, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              },
              margins: {
                top: Math.round(8 * scale * 20),
                bottom: Math.round(8 * scale * 20),
                left: Math.round(8 * scale * 20),
                right: Math.round(4 * scale * 20)
              }
            }),
            new TableCell({
              children: educationContent.length > 0 ? educationContent : [new Paragraph("")],
              width: { size: 4500, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              },
              margins: {
                top: Math.round(8 * scale * 20),
                bottom: Math.round(8 * scale * 20),
                left: Math.round(4 * scale * 20),
                right: Math.round(8 * scale * 20)
              }
            })
          ]
        })
      ],
      width: { size: 9000, type: WidthType.DXA }
    });

    children.push(skillsEducationTable);
  }

  // Experience
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Experience",
            bold: true,
            size: Math.round(11 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Helvetica"
          })
        ],
        spacing: { before: Math.round(12 * scale * 20), after: Math.round(4 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      // Create experience container with border and background
      const experienceContent = [];

      // Title
      experienceContent.push(
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
          spacing: { after: Math.round(3 * scale * 20) }
        })
      );

      // Company
      experienceContent.push(
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

      // Date with background styling
      experienceContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(8 * scale * 2),
              color: "666666",
              font: "Helvetica"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) },
          shading: {
            fill: "F0F0F0"
          },
          indent: { left: Math.round(4 * scale * 20), right: Math.round(4 * scale * 20) }
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          experienceContent.push(
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
              indent: { left: Math.round(8 * scale * 20) }
            })
          );
        });
      }

      // Create table for experience container to simulate bordered box
      const experienceTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: experienceContent,
                width: { size: 9000, type: WidthType.DXA },
                borders: {
                  top: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE },
                  bottom: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE },
                  left: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE },
                  right: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE }
                },
                margins: {
                  top: Math.round(6 * scale * 20),
                  bottom: Math.round(6 * scale * 20),
                  left: Math.round(6 * scale * 20),
                  right: Math.round(6 * scale * 20)
                },
                shading: {
                  fill: "FCFCFC"
                }
              })
            ]
          })
        ],
        width: { size: 9000, type: WidthType.DXA }
      });

      children.push(experienceTable);

      // Add spacing between experience items
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 1 })],
          spacing: { after: Math.round(10 * scale * 20) }
        })
      );
    });
  }

  return children;
}

function createCreativeTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4; // Use 1.4x scaling for optimal DOCX readability
  const children = [];

  // Header with creative center alignment and decorative line
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(18 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Georgia"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(8 * scale * 20), after: Math.round(4 * scale * 20) }
    })
  );

  // Decorative line (using underscores to simulate line)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "————————————————————————————————————————————————",
          size: Math.round(6 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          font: "Georgia"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(4 * scale * 20) }
    })
  );

  // Contact info - centered and italic
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666",
          italics: true,
          font: "Georgia"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(15 * scale * 20) }
    })
  );

  // Profile/Summary with centered styling and border
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
            size: Math.round(9 * scale * 2),
            italics: true,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(12 * scale * 20) },
        shading: {
          fill: "FAFAFA"
        },
        border: {
          top: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, size: 4, style: BorderStyle.SINGLE },
          bottom: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, size: 4, style: BorderStyle.SINGLE },
          left: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, size: 4, style: BorderStyle.SINGLE },
          right: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, size: 4, style: BorderStyle.SINGLE }
        },
        indent: { left: Math.round(150 * scale), right: Math.round(150 * scale) }
      })
    );
  }

  // Experience with centered styling and individual bordered containers
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Experience",
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

    // Decorative line under Experience header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "——————————————————————————————————",
            size: Math.round(6 * scale * 2),
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            font: "Georgia"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(8 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      // Create experience container with centered content and border
      const experienceContent = [];

      // Title
      experienceContent.push(
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
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      // Company
      experienceContent.push(
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
          spacing: { after: Math.round(2 * scale * 20) }
        })
      );

      // Date
      experienceContent.push(
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
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );

      // Bullets (left-aligned within the container)
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          experienceContent.push(
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
              indent: { left: Math.round(15 * scale * 20) }
            })
          );
        });
      }

      // Create table for experience container to simulate bordered box
      const experienceTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: experienceContent,
                width: { size: 8000, type: WidthType.DXA },
                borders: {
                  top: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 4, style: BorderStyle.SINGLE },
                  bottom: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 4, style: BorderStyle.SINGLE },
                  left: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 4, style: BorderStyle.SINGLE },
                  right: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 4, style: BorderStyle.SINGLE }
                },
                margins: {
                  top: Math.round(8 * scale * 20),
                  bottom: Math.round(8 * scale * 20),
                  left: Math.round(8 * scale * 20),
                  right: Math.round(8 * scale * 20)
                },
                shading: {
                  fill: "FAFAFA"
                }
              })
            ]
          })
        ],
        width: { size: 8000, type: WidthType.DXA },
        alignment: AlignmentType.CENTER
      });

      children.push(experienceTable);

      // Add spacing between experience items
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 1 })],
          spacing: { after: Math.round(15 * scale * 20) }
        })
      );
    });
  }

  // Skills and Education Side-by-Side (using table to match PDF layout)
  if ((userData.resumeData?.skills && userData.resumeData.skills.length > 0) ||
      (userData.resumeData?.education && userData.resumeData.education.length > 0)) {

    // Create skills column content
    const skillsContent = [];
    if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
      skillsContent.push(
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

      skillsContent.push(
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
      skillsContent.push(
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

    // Create education column content
    const educationContent = [];
    if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
      educationContent.push(
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

      educationContent.push(
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
        educationContent.push(
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

        educationContent.push(
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

        educationContent.push(
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

    // Create two-column table to match PDF layout
    const skillsEducationTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: skillsContent.length > 0 ? skillsContent : [new Paragraph("")],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              }
            }),
            new TableCell({
              children: educationContent.length > 0 ? educationContent : [new Paragraph("")],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              }
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    children.push(skillsEducationTable);
  }

  return children;
}

function createMinimalTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4;
  const children = [];

  // Name with minimal, light typography
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          size: Math.round(18 * scale * 2),
          color: "000000",
          font: "system-ui"
        })
      ],
      spacing: { after: Math.round(4 * scale * 20) }
    })
  );

  // Contact info with bullet separator
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666",
          font: "system-ui"
        })
      ],
      spacing: { after: Math.round(20 * scale * 20) }
    })
  );

  // Summary without header, clean paragraph
  if (userData.resumeData?.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: userData.resumeData.summary,
            size: Math.round(10 * scale * 2),
            color: "333333",
            font: "system-ui"
          })
        ],
        spacing: { after: Math.round(16 * scale * 20) }
      })
    );
  }

  // Experience with clean header and minimal styling
  if (userData.resumeData?.experience && userData.resumeData.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Experience",
            bold: true,
            size: Math.round(12 * scale * 2),
            color: "000000",
            font: "system-ui"
          })
        ],
        spacing: { before: Math.round(16 * scale * 20), after: Math.round(8 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      // Title and date on same line with space between
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'title'),
              bold: true,
              size: Math.round(11 * scale * 2),
              color: "000000",
              font: "system-ui"
            }),
            new TextRun({
              text: `                      ${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "system-ui"
            })
          ],
          spacing: { before: Math.round(12 * scale * 20), after: Math.round(2 * scale * 20) }
        })
      );

      // Company with accent color
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safeProp(exp, 'company'),
              size: Math.round(10 * scale * 2),
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              font: "system-ui"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) }
        })
      );

      // Bullets with accent color
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: Math.round(9 * scale * 2),
                  color: "444444",
                  font: "system-ui"
                })
              ],
              spacing: { after: Math.round(2 * scale * 20) },
              indent: { left: Math.round(8 * scale * 20) }
            })
          );
        });
      }
    });
  }

  // Skills and Education in side-by-side grid layout
  if ((userData.resumeData?.skills && userData.resumeData.skills.length > 0) ||
      (userData.resumeData?.education && userData.resumeData.education.length > 0)) {

    // Create skills content
    const skillsContent = [];
    if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
      skillsContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Skills",
              bold: true,
              size: Math.round(12 * scale * 2),
              color: "000000",
              font: "system-ui"
            })
          ],
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );

      // Skills with subtle underline effect
      userData.resumeData.skills.forEach(skill => {
        skillsContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: skill,
                size: Math.round(9 * scale * 2),
                color: "555555",
                font: "system-ui"
              })
            ],
            spacing: { after: Math.round(4 * scale * 20) },
            border: {
              bottom: {
                color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}20`,
                space: 1,
                size: 1,
                style: BorderStyle.SINGLE
              }
            }
          })
        );
      });
    }

    // Create education content
    const educationContent = [];
    if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
      educationContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Education",
              bold: true,
              size: Math.round(12 * scale * 2),
              color: "000000",
              font: "system-ui"
            })
          ],
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );

      limitEducation(userData.resumeData.education, 2).forEach(edu => {
        educationContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeProp(edu, 'area') || safeProp(edu, 'degree'),
                bold: true,
                size: Math.round(10 * scale * 2),
                color: "000000",
                font: "system-ui"
              })
            ],
            spacing: { after: Math.round(2 * scale * 20) }
          })
        );

        educationContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
                size: Math.round(9 * scale * 2),
                color: "666666",
                font: "system-ui"
              })
            ],
            spacing: { after: Math.round(2 * scale * 20) }
          })
        );

        educationContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${formatDate(edu.start)} - ${formatDate(edu.end)}`,
                size: Math.round(8 * scale * 2),
                color: "999999",
                font: "system-ui"
              })
            ],
            spacing: { after: Math.round(8 * scale * 20) }
          })
        );
      });
    }

    // Create side-by-side table with 2fr 1fr ratio (skills taking more space)
    const skillsEducationTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: skillsContent.length > 0 ? skillsContent : [new Paragraph("")],
              width: { size: 6000, type: WidthType.DXA }, // 2fr equivalent
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              },
              margins: {
                right: Math.round(20 * scale * 20)
              }
            }),
            new TableCell({
              children: educationContent.length > 0 ? educationContent : [new Paragraph("")],
              width: { size: 3000, type: WidthType.DXA }, // 1fr equivalent
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              }
            })
          ]
        })
      ],
      width: { size: 9000, type: WidthType.DXA }
    });

    children.push(skillsEducationTable);
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
        height: {
          value: 100,
          rule: "atLeast"
        },
        children: [
          new TableCell({
            children: leftColumnContent,
            width: {
              size: 3150,
              type: WidthType.DXA,
            },
            shading: {
              fill: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
            },
            margins: {
              top: Math.round(50 * scale),
              bottom: Math.round(50 * scale),
              left: Math.round(50 * scale),
              right: Math.round(25 * scale)
            },
            verticalAlign: "top"
          }),
          new TableCell({
            children: rightColumnContent,
            width: {
              size: 5850,
              type: WidthType.DXA,
            },
            margins: {
              top: Math.round(50 * scale),
              bottom: Math.round(50 * scale),
              left: Math.round(25 * scale),
              right: Math.round(50 * scale)
            },
            verticalAlign: "top"
          })
        ]
      })
    ],
    width: {
      size: 9000,
      type: WidthType.DXA,
    },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    }
  });

  children.push(table);

  return children;
}

function createExecutiveTemplate(userData, accent) {
  const accentColor = hexToRgb(accent);
  const scale = 1.4;
  const children = [];

  // Executive header with bottom border
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (userData.resumeData?.name || userData.name || 'YOUR NAME').toUpperCase(),
          bold: true,
          size: Math.round(16 * scale * 2),
          color: "000000",
          font: "Times"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(8 * scale * 20), after: Math.round(6 * scale * 20) }
    })
  );

  // Contact info with pipe separator
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} | ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666",
          font: "Times"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(15 * scale * 20) },
      border: {
        bottom: {
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
          space: 1,
          size: Math.round(3 * scale),
          style: BorderStyle.SINGLE
        }
      }
    })
  );

  // Executive Summary with top and bottom borders
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
        spacing: { before: Math.round(20 * scale * 20), after: Math.round(8 * scale * 20) }
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
            font: "Times"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: Math.round(12 * scale * 20) },
        border: {
          top: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: 4,
            style: BorderStyle.SINGLE
          },
          bottom: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: 4,
            style: BorderStyle.SINGLE
          }
        },
        indent: { left: Math.round(200 * scale), right: Math.round(200 * scale) }
      })
    );
  }

  // Professional Experience with individual bordered containers
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
        spacing: { before: Math.round(20 * scale * 20), after: Math.round(12 * scale * 20) }
      })
    );

    limitExperience(userData.resumeData.experience).forEach(exp => {
      // Create experience container content
      const experienceContent = [];

      // Header with title and date on same line
      experienceContent.push(
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
              text: `                ${formatDate(exp.start)} - ${formatDate(exp.end)}`,
              bold: true,
              size: Math.round(9 * scale * 2),
              color: "666666",
              font: "Times"
            })
          ],
          spacing: { after: Math.round(4 * scale * 20) },
          border: {
            bottom: {
              color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
              space: 1,
              size: 2,
              style: BorderStyle.SINGLE
            }
          }
        })
      );

      // Company
      experienceContent.push(
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
          spacing: { after: Math.round(6 * scale * 20) }
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          experienceContent.push(
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
              indent: { left: Math.round(15 * scale * 20) },
              alignment: AlignmentType.JUSTIFIED
            })
          );
        });
      }

      // Create table for experience container
      const experienceTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: experienceContent,
                width: { size: 9000, type: WidthType.DXA },
                borders: {
                  top: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE },
                  bottom: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE },
                  left: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE },
                  right: { color: "E0E0E0", space: 1, size: 4, style: BorderStyle.SINGLE }
                },
                margins: {
                  top: Math.round(12 * scale * 20),
                  bottom: Math.round(12 * scale * 20),
                  left: Math.round(12 * scale * 20),
                  right: Math.round(12 * scale * 20)
                },
                shading: {
                  fill: "FAFAFA"
                }
              })
            ]
          })
        ],
        width: { size: 9000, type: WidthType.DXA }
      });

      children.push(experienceTable);

      // Add spacing between experience items
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 1 })],
          spacing: { after: Math.round(15 * scale * 20) }
        })
      );
    });
  }

  // Core Competencies and Education Side-by-Side
  if ((userData.resumeData?.skills && userData.resumeData.skills.length > 0) ||
      (userData.resumeData?.education && userData.resumeData.education.length > 0)) {

    // Create skills content
    const skillsContent = [];
    if (userData.resumeData?.skills && userData.resumeData.skills.length > 0) {
      skillsContent.push(
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
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );

      // Create skills in a 2-column grid format within the cell
      const skillsGrid = [];
      const skills = userData.resumeData.skills.slice(0, 8);
      for (let i = 0; i < skills.length; i += 2) {
        const leftSkill = skills[i];
        const rightSkill = skills[i + 1] || '';

        skillsContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${leftSkill}${rightSkill ? '                    ' + rightSkill : ''}`,
                size: Math.round(9 * scale * 2),
                color: "333333",
                font: "Times"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: Math.round(3 * scale * 20) },
            shading: {
              fill: "FFFFFF"
            },
            border: {
              top: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE },
              bottom: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE },
              left: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE },
              right: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE }
            }
          })
        );
      }
    }

    // Create education content
    const educationContent = [];
    if (userData.resumeData?.education && userData.resumeData.education.length > 0) {
      educationContent.push(
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
          spacing: { after: Math.round(8 * scale * 20) }
        })
      );

      limitEducation(userData.resumeData.education, 2).forEach(edu => {
        // Education item container
        const eduContent = [];
        eduContent.push(
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
            spacing: { after: Math.round(2 * scale * 20) }
          })
        );

        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeProp(edu, 'institution') || safeProp(edu, 'school'),
                size: Math.round(9 * scale * 2),
                color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
                font: "Times"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: Math.round(2 * scale * 20) }
          })
        );

        eduContent.push(
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
            spacing: { after: Math.round(6 * scale * 20) }
          })
        );

        // Add education item with border
        educationContent.push(
          new Paragraph({
            children: eduContent.map(p => p.children).flat(),
            alignment: AlignmentType.CENTER,
            spacing: { after: Math.round(8 * scale * 20) },
            shading: {
              fill: "FFFFFF"
            },
            border: {
              top: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE },
              bottom: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE },
              left: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE },
              right: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 2, style: BorderStyle.SINGLE }
            }
          })
        );
      });
    }

    // Create side-by-side table
    const skillsEducationTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: skillsContent.length > 0 ? skillsContent : [new Paragraph("")],
              width: { size: 4500, type: WidthType.DXA },
              borders: {
                top: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE },
                bottom: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE },
                left: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE },
                right: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE }
              },
              margins: {
                top: Math.round(12 * scale * 20),
                bottom: Math.round(12 * scale * 20),
                left: Math.round(12 * scale * 20),
                right: Math.round(12 * scale * 20)
              },
              shading: {
                fill: "F8F9FA"
              }
            }),
            new TableCell({
              children: educationContent.length > 0 ? educationContent : [new Paragraph("")],
              width: { size: 4500, type: WidthType.DXA },
              borders: {
                top: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE },
                bottom: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE },
                left: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE },
                right: { color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`, space: 1, size: 6, style: BorderStyle.SINGLE }
              },
              margins: {
                top: Math.round(12 * scale * 20),
                bottom: Math.round(12 * scale * 20),
                left: Math.round(12 * scale * 20),
                right: Math.round(12 * scale * 20)
              },
              shading: {
                fill: "F8F9FA"
              }
            })
          ]
        })
      ],
      width: { size: 9000, type: WidthType.DXA }
    });

    children.push(skillsEducationTable);
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
      const session = await getServerSession(req, res, authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
        const entitlement = await getUserEntitlement(userId);
        userPlan = getEffectivePlan(entitlement); // Use effective plan to handle expired day passes
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

    // Free users can only use Professional template and default color
    const effectiveTemplate = userPlan === 'free' ? 'professional' : template;
    const effectiveAccent = userPlan === 'free' ? '#6b7280' : accent;

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
    
    // Track usage and consume credit after successful generation
    if (userId) {
      await consumeCredit(userId, 'download');
      await trackApiUsage(userId, 'docx-download');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(buffer);
  } catch (error) {
    console.error('DOCX generation error:', error);
    return res.status(500).json({ error: "Failed to generate DOCX file" });
  }
}