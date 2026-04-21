import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { utcToLocal } from '../../utils/date';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#333' },
  header: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  meta: { fontSize: 10, color: '#64748b', marginBottom: 4 },
  section: { marginVertical: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  sectionBox: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 4, border: '1 solid #e2e8f0' },
  bodyText: { fontSize: 11, lineHeight: 1.5, color: '#334155' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
});

const MOODS: Record<number, string> = {
  1: 'Berat',
  2: 'Biasa',
  3: 'Oke',
  4: 'Baik',
  5: 'Produktif!',
};

export default function ReportPDF({ report }: { report: any }) {
  const moodText = MOODS[report.mood || 3] || 'Oke';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{report.title || 'Laporan Kerja'}</Text>
          <Text style={styles.meta}>Oleh: {report.user_name || '-'}</Text>
          <Text style={styles.meta}>
            Tanggal: {report.report_date ? utcToLocal(report.report_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
          </Text>
          <Text style={styles.meta}>Tipe: {report.report_type === 'daily' ? 'Harian' : 'Mingguan'}</Text>
          <Text style={styles.meta}>Mood: {moodText}</Text>
        </View>

        {report.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi Kegiatan</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.description}</Text>
            </View>
          </View>
        ) : null}

        {report.achievements ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pencapaian</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.achievements}</Text>
            </View>
          </View>
        ) : null}

        {report.obstacles ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kendala / Hambatan</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.obstacles}</Text>
            </View>
          </View>
        ) : null}

        {report.next_plans ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rencana Berikutnya</Text>
            <View style={styles.sectionBox}>
              <Text style={styles.bodyText}>{report.next_plans}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text>Alpha - Internal Work Management | Dicetak pada {new Date().toLocaleDateString('id-ID')}</Text>
        </View>
      </Page>
    </Document>
  );
}
