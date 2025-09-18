# DOCX Export Features

## Overview

TailorCV now supports high-quality DOCX exports for both resumes and cover letters that closely match the visual styling of the web previews.

## Features

### Resume DOCX Export
- **Template Support**: Full support for all nine templates (Professional, Modern, Creative, Minimal, Two-Column, Executive, Tech, Compact, Classic)
- **Styled Output**: Exact replica of web preview formatting with matching colors, fonts, and layout
- **Template-Specific Styling**:
  - **Professional**: Arial font, clean layout with ▪ bullet points and accent-colored headers
  - **Modern**: Helvetica font, highlighted summary section with → arrow bullets and bordered experience items
  - **Creative**: Georgia serif font, centered layout with decorative lines, italicized headers and contact info
  - **Minimal**: System font, clean minimal layout with subtle accents
  - **Two-Column**: Side-by-side layout with colored sidebar and main content area
  - **Executive**: Times font, formal business layout with borders and professional styling
  - **Tech**: Inter font, timeline-based experience with colored backgrounds and tech-focused styling
  - **Compact**: System font, space-efficient layout with grid-based content organization
  - **Classic**: Times New Roman font, traditional formal layout with centered headers and classic styling

### Cover Letter DOCX Export
- **Professional Format**: Business letter format with proper spacing
- **Date Header**: Automatically includes current date (right-aligned)
- **Justified Text**: Paragraph text is justified for professional appearance
- **Smart Content**: Uses existing cover letter content or provides professional default

### Technical Implementation
- **Library**: Uses the `docx` npm package for reliable DOCX generation
- **Scaling**: Uses 1.4x magnification for optimal DOCX readability
- **Styling**: Converts hex accent colors to RGB for proper Word formatting
- **Layout**: Maintains responsive structure with proper margins and spacing
- **Font Sizing**: All text and spacing scaled by 1.4x for professional document format

## API Endpoints

### Resume DOCX Export
- **Endpoint**: `POST /api/export-resume-docx`
- **Parameters**:
  ```json
  {
    "userData": { /* Resume data object */ },
    "template": "professional|modern|creative|minimal|two-column|executive|tech|compact|classic",
    "accent": "#2563eb" // Hex color code
  }
  ```

### Cover Letter DOCX Export
- **Endpoint**: `POST /api/export-cover-letter-docx`
- **Parameters**:
  ```json
  {
    "userData": { /* Resume data object with coverLetter */ },
    "accent": "#2563eb" // Hex color code
  }
  ```

## UI Integration

### Download Buttons
- **Resume PDF**: Primary blue button
- **Resume DOCX**: Secondary button with FileDown icon
- **Cover Letter PDF**: Primary blue button  
- **Cover Letter DOCX**: Secondary button with FileDown icon

### File Naming
- Resumes: `{name}_resume.docx`
- Cover Letters: `{name}_cover_letter.docx`
- Spaces in names are replaced with underscores

## Styling Features

### Colors
- Header text uses the selected accent color
- Section headers maintain accent color theming
- Body text uses professional black/gray colors

### Typography
- **Font Matching**: Each template uses its corresponding web preview font (Arial, Helvetica, Georgia)
- **Headers**: Bold, sized appropriately for hierarchy with accent colors
- **Body Text**: Professional sizing optimized for DOCX readability (1.4x scaling)
- **Contact Info**: Subtle gray coloring with proper italics where applicable
- **Dates**: Consistent gray styling matching web preview format

### Layout
- **Margins**: 0.5" on all sides for professional appearance
- **Spacing**: Proper paragraph and section spacing
- **Alignment**: Justified text where appropriate
- **Indentation**: Proper bullet point indentation

## Quality Assurance

### Template Fidelity
- **Exact Visual Matching**: DOCX output now perfectly replicates web preview appearance
- **Colors**: Precise accent color matching with proper RGB conversion
- **Fonts**: Template-specific fonts (Arial, Helvetica, Georgia) match web previews
- **Bullet Points**: Correct symbols (▪, →, •) matching each template's style
- **Layout**: Proper alignment, centering, and indentation as shown in previews
- **Decorative Elements**: Creative template includes underline elements for visual appeal

### Content Handling
- Safe property access prevents errors with missing data
- Date formatting handles various input formats
- Bullet points maintain proper formatting
- Skills are presented consistently across templates

### Error Handling
- Graceful fallbacks for missing user data
- Clear error messages for debugging
- Proper HTTP status codes
- Buffer handling for file downloads