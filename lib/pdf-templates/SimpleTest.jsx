import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const SimpleTest = ({ data, accent = '#333333' }) => {
  console.log('SimpleTest Debug - data:', JSON.stringify(data, null, 2));
  
  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 12,
      fontFamily: 'Helvetica',
    },
    title: {
      fontSize: 20,
      marginBottom: 10,
      color: accent,
    },
    text: {
      marginBottom: 5,
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data?.name || 'Test Name'}</Text>
        <Text style={styles.text}>Email: {data?.email || 'test@email.com'}</Text>
        <Text style={styles.text}>Phone: {data?.phone || 'Test Phone'}</Text>
        
        {data?.summary && (
          <Text style={styles.text}>Summary: {data.summary}</Text>
        )}
        
        {data?.skills && data.skills.length > 0 && (
          <Text style={styles.text}>Skills: {data.skills.join(', ')}</Text>
        )}
        
        <Text style={styles.text}>Debug - Data Keys: {Object.keys(data || {}).join(', ')}</Text>
      </Page>
    </Document>
  );
};

export default SimpleTest;