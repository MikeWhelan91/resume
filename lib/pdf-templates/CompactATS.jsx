import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { createBaseStyles } from './styles';

const CompactATS = ({ data, accent = '#333333', isCoverLetter = false }) => {
  const styles = createBaseStyles(accent);
  
  console.log('CompactATS Debug - data keys:', Object.keys(data || {}));
  console.log('CompactATS Debug - name:', data?.name);
  console.log('CompactATS Debug - isCoverLetter:', isCoverLetter);

  const renderBulletPoint = (text, index) => (
    <View key={index} style={styles.bullet}>
      <Text style={styles.bulletPoint}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );

  const renderCoverLetter = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.title}>{data.title || data.label}</Text>
          <View style={styles.contact}>
            <Text>{data.email}</Text>
            <Text>•</Text>
            <Text>{data.phone}</Text>
            {data.url && (
              <>
                <Text>•</Text>
                <Text>{data.url}</Text>
              </>
            )}
          </View>
        </View>

        {/* Cover Letter Content */}
        <View style={styles.section}>
          <Text style={styles.summary}>
            {typeof data.coverLetter === 'string' 
              ? data.coverLetter 
              : data.coverLetter?.body || ''}
          </Text>
        </View>
      </Page>
    </Document>
  );

  const renderResume = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.title}>{data.title || data.label}</Text>
          <View style={styles.contact}>
            <Text>{data.email}</Text>
            <Text>•</Text>
            <Text>{data.phone}</Text>
            {data.url && (
              <>
                <Text>•</Text>
                <Text>{data.url}</Text>
              </>
            )}
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsList}>
              {data.skills.map((skill, index) => (
                <Text key={index} style={styles.skill}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience.map((job, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.itemHeader}>
                  <View style={styles.flex1}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.company}>{job.company}</Text>
                    {job.location && (
                      <Text style={styles.location}>{job.location}</Text>
                    )}
                  </View>
                  <Text style={styles.dates}>
                    {job.start} - {job.end}
                  </Text>
                </View>
                {job.bullets && job.bullets.length > 0 && (
                  <View style={styles.bulletList}>
                    {job.bullets.map((bullet, bulletIndex) => 
                      renderBulletPoint(bullet, bulletIndex)
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.itemHeader}>
                  <View style={styles.flex1}>
                    <Text style={styles.company}>{edu.institution}</Text>
                    <Text style={styles.jobTitle}>{edu.area || edu.degree}</Text>
                  </View>
                  <Text style={styles.dates}>
                    {edu.start} - {edu.end}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );

  return isCoverLetter ? renderCoverLetter() : renderResume();
};

export default CompactATS;