import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { limitExperience, limitEducation } from "../../lib/renderUtils.js";

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

  // Name (large, centered)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(18 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(4 * scale * 20) }
    })
  );

  // Contact info
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: Math.round(12 * scale * 20) }
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
        border: {
          left: {
            color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`,
            space: 1,
            size: Math.round(4 * scale),
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

  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userData.resumeData?.name || userData.name || 'Your Name',
          bold: true,
          size: Math.round(16 * scale * 2),
          color: `${accentColor.r.toString(16).padStart(2, '0')}${accentColor.g.toString(16).padStart(2, '0')}${accentColor.b.toString(16).padStart(2, '0')}`
        })
      ],
      spacing: { after: Math.round(4 * scale * 20) }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${userData.resumeData?.email || userData.email || 'your.email@example.com'} • ${userData.resumeData?.phone || userData.phone || 'Your Phone'}`,
          size: Math.round(9 * scale * 2),
          color: "666666"
        })
      ],
      spacing: { after: Math.round(12 * scale * 20) }
    })
  );

  // Summary
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
        spacing: { after: Math.round(12 * scale * 20) }
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
              font: "Georgia"
            })
          ],
          spacing: { before: Math.round(6 * scale * 20), after: Math.round(2 * scale * 20) },
          indent: { left: Math.round(180 * scale) }
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
          spacing: { after: Math.round(2 * scale * 20) },
          indent: { left: Math.round(180 * scale) }
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
          spacing: { after: Math.round(4 * scale * 20) },
          indent: { left: Math.round(180 * scale) }
        })
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
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
              indent: { left: Math.round(240 * scale) }
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userData, template = 'professional', accent = '#2563eb' } = req.body;

    if (!userData) {
      return res.status(400).json({ error: "No user data provided" });
    }

    let documentChildren;
    
    switch (template) {
      case 'modern':
        documentChildren = createModernTemplate(userData, accent);
        break;
      case 'creative':
        documentChildren = createCreativeTemplate(userData, accent);
        break;
      case 'professional':
      default:
        documentChildren = createProfessionalTemplate(userData, accent);
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
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(buffer);
  } catch (error) {
    console.error('DOCX generation error:', error);
    return res.status(500).json({ error: "Failed to generate DOCX file" });
  }
}