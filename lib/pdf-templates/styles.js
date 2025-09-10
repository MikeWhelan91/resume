import { StyleSheet } from '@react-pdf/renderer';

// Base styles that all templates can use
export const createBaseStyles = (accent = '#000000') => StyleSheet.create({
  page: {
    padding: '14mm',
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#1a1a1a',
  },
  
  // Header styles
  header: {
    marginBottom: 20,
    borderBottom: `2px solid ${accent}`,
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: accent,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  contact: {
    fontSize: 10,
    color: '#555',
    flexDirection: 'row',
    gap: 8,
  },
  
  // Section styles
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: accent,
    borderBottom: `1px solid ${accent}`,
    paddingBottom: 3,
    marginBottom: 8,
  },
  
  // Experience/Education item styles
  item: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  company: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 10,
    color: '#555',
  },
  dates: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  
  // Content styles
  summary: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 12,
    marginTop: 3,
  },
  bullet: {
    fontSize: 10,
    lineHeight: 1.3,
    marginBottom: 2,
    flexDirection: 'row',
  },
  bulletPoint: {
    width: 8,
  },
  bulletText: {
    flex: 1,
  },
  
  // Skills styles
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skill: {
    fontSize: 10,
    backgroundColor: '#f5f5f5',
    padding: '2 6',
    borderRadius: 3,
    border: `1px solid ${accent}`,
  },
  
  // Utility styles
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
});

// Color variations - maps hex codes to friendly names
export const ACCENT_COLORS = {
  '#10b39f': '#10b39f', // teal
  '#2563eb': '#2563eb', // blue
  '#7c3aed': '#7c3aed', // purple 
  '#f97316': '#f97316', // orange
  '#ef4444': '#ef4444', // red
  '#111827': '#111827', // dark
};

// Helper to get accent color (fallback to provided color if not in map)
export const getAccentColor = (color) => ACCENT_COLORS[color] || color;