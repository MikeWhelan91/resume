import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const SimpleCoverLetter = ({ data, accent = '#333333' }) => {
  console.log('SimpleCoverLetter Debug - data:', JSON.stringify(data, null, 2));
  
  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 12,
      fontFamily: 'Helvetica',
    },
    title: {
      fontSize: 18,
      marginBottom: 20,
      color: accent,
    },
    text: {
      marginBottom: 10,
      lineHeight: 1.5,
    }
  });

  // Get cover letter text
  const coverLetterText = typeof data.coverLetter === 'string' 
    ? data.coverLetter 
    : data.coverLetter?.body || 'DEBUG: No cover letter found';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data?.name || 'Your Name'}</Text>
        <Text style={styles.text}>{data?.email || 'your.email@example.com'}</Text>
        <Text style={styles.text}>{data?.phone || 'Your Phone'}</Text>
        
        <Text style={styles.text}>Cover Letter Content:</Text>
        <Text style={styles.text}>{coverLetterText}</Text>
        
        <Text style={styles.text}>DEBUG - Available data keys: {Object.keys(data || {}).join(', ')}</Text>
        <Text style={styles.text}>DEBUG - coverLetter type: {typeof data?.coverLetter}</Text>
      </Page>
    </Document>
  );
};

export default SimpleCoverLetter;