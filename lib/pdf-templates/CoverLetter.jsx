import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const CoverLetter = ({ data, accent = '#333333' }) => {
  console.log('CoverLetter Debug - data keys:', Object.keys(data || {}));
  console.log('CoverLetter Debug - name:', data?.name);
  console.log('CoverLetter Debug - coverLetter:', data?.coverLetter);
  
  const styles = StyleSheet.create({
    page: {
      padding: '20mm',
      fontSize: 12,
      fontFamily: 'Helvetica',
      lineHeight: 1.6,
      color: '#1a1a1a',
    },
    
    // Header with contact info
    header: {
      marginBottom: 30,
      textAlign: 'left',
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
      color: accent,
    },
    contact: {
      fontSize: 11,
      color: '#555',
      lineHeight: 1.4,
    },
    
    // Date and recipient
    date: {
      fontSize: 11,
      marginBottom: 20,
      textAlign: 'right',
    },
    
    // Main content
    content: {
      fontSize: 12,
      lineHeight: 1.6,
      textAlign: 'justify',
      marginBottom: 15,
    },
    
    // Signature area
    signature: {
      marginTop: 30,
      fontSize: 12,
    }
  });

  // Get cover letter text
  const coverLetterText = typeof data.coverLetter === 'string' 
    ? data.coverLetter 
    : data.coverLetter?.body || data.coverLetter?.bodyHtml?.replace(/<[^>]*>/g, '') || 'No cover letter content available.';

  // Split into paragraphs
  const paragraphs = coverLetterText.split(/\n\s*\n/).filter(p => p.trim());

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with name and contact */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.name || 'Your Name'}</Text>
          <Text style={styles.contact}>{data.email || 'your.email@example.com'}</Text>
          <Text style={styles.contact}>{data.phone || 'Your Phone Number'}</Text>
          {data.url && <Text style={styles.contact}>{data.url}</Text>}
        </View>

        {/* Date */}
        <Text style={styles.date}>{today}</Text>

        {/* Cover letter content */}
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.content}>
              {paragraph.trim()}
            </Text>
          ))
        ) : (
          <Text style={styles.content}>
            No cover letter content available. Please ensure your cover letter was generated properly.
          </Text>
        )}

        {/* Signature */}
        <View style={styles.signature}>
          <Text>Sincerely,</Text>
          <Text style={{ marginTop: 20 }}>{data.name || 'Your Name'}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CoverLetter;