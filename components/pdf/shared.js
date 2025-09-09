import { StyleSheet, Text, View } from '@react-pdf/renderer';

// Accent theme tokens
export const theme = {
  teal: '#00C9A7',
  blue: '#3388FF',
  purple: '#7A5AF8',
  green: '#22C55E',
  orange: '#FF8A3D',
  gray: '#475569',
};

export function getTheme(accent) {
  const color = theme[accent] || accent || theme.teal;
  return { accent: color };
}

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  const bigint = parseInt(v, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function dedupe(arr = []) {
  return arr.filter((x, i) => i === 0 || JSON.stringify(x) !== JSON.stringify(arr[i - 1]));
}

const base = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#000',
  },
  h1: { fontSize: 18, fontWeight: 700 },
  h2: { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  text: { fontSize: 9.5, fontWeight: 400 },
  meta: { fontSize: 8.5, color: '#555' },
  chip: { fontSize: 9.5, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, marginRight: 4, marginBottom: 4 },
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
});

export const styles = {
  ...base,
  Rule: ({ color = '#000', style }) => <View style={[{ height: 1, backgroundColor: color }, style]} />, // hairline rule
};

export function Section({ children, style, ...rest }) {
  return (
    <View style={[{ marginBottom: 12 }, style]} {...rest}>
      {children}
    </View>
  );
}

export function H({ children, style }) {
  return <Text style={[base.h2, style]}>{children}</Text>;
}

export function Meta({ children, style }) {
  return <Text style={[base.meta, style]}>{children}</Text>;
}

export function Chip({ children, theme: t, atsMode, style }) {
  const fill = atsMode ? 'transparent' : withAlpha(t.accent, 0.08);
  const borderColor = atsMode ? '#000' : t.accent;
  return (
    <Text style={[base.chip, { backgroundColor: fill, borderColor }, style]}>{children}</Text>
  );
}

export function Row({ children, style, ...rest }) {
  return (
    <View style={[base.row, style]} {...rest}>
      {children}
    </View>
  );
}

export function Col({ children, style, ...rest }) {
  return (
    <View style={[base.col, style]} {...rest}>
      {children}
    </View>
  );
}

