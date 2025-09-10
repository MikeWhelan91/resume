import CompactATS from './CompactATS';
import CoverLetter from './CoverLetter';
import SimpleTest from './SimpleTest';
import SimpleCoverLetter from './SimpleCoverLetter';

export const PDF_TEMPLATES = {
  'compact-ats': CompactATS,  // Use simple test temporarily
  'elegant-lines': SimpleTest,
  'minimal-html': SimpleTest,
  'modern-serif': SimpleTest,  
  'mono-tech': SimpleTest,
  'slate-twocol': SimpleTest,
};

export const getPDFTemplate = (templateId) => {
  return PDF_TEMPLATES[templateId] || CompactATS;
};

export const getCoverLetterTemplate = () => {
  return SimpleCoverLetter; // Use simple test temporarily
};

export { CompactATS, CoverLetter };
export * from './styles';