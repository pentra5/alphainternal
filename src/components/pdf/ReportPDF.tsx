import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#333' },
  header: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  meta: { fontSize: 10, color: '#64748b', marginBottom: 4 },
  section: { marginVertical: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  sectionBox: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 4, border: '1 solid #e2e8f0' },
  bodyText: { fontSize: 11, lineHeight: 1.5, color: '#334155' },
});

export default function ReportPDF({ report }: { report: any }) {
  const MOODS = ['😔 Berat', '😐 Biasa', '🙂 Oke', '😊 Baik', '🔥 Produktif!'];
  const moodText = MOODS[(report.mood || 3) - 1] || '🙂 Oke';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.meta}>Oleh: {report.user_name}</Text>
          <Text style={styles.meta}>Tanggal: {new Date(report.report_date).toLocaleDateString('id-ID')}</Text>
          <Text style={styles.meta}>Tipe: {report.report_type === 'daily' ? 'Harian' : 'Mingguan'}</Text>
          <Text style={styles.meta}>Mood: {moodText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi Kegiatan</Text>
          <View style={styles.sectionBox}>
            <Text style={styles.bodyText}>{report.description}</Text>
          </View>
        </View>

        {report.achievements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pencapaian</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.achievements}</Text>
            </View>
          </View>
        )}

        {report.obstacles && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kendala / Hambatan</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.obstacles}</Text>
            </View>
          </View>
        )}

        {report.next_plans && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rencana Berikutnya</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.next_plans}</Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
