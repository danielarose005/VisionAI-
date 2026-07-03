import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ANALYSIS_PROMPT, analyzeImage } from './lib/gemini';

export default function ResultScreen({ route, navigation }) {
  const { base64Image } = route.params ?? {};
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(base64Image));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!base64Image) {
      setError('No image available to analyze.');
      setLoading(false);
      return;
    }

    let isActive = true;

    async function runAnalysis() {
      setLoading(true);
      setError('');

      try {
        const json = await analyzeImage(base64Image, ANALYSIS_PROMPT);

        if (!isActive) {
          return;
        }

        const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        let parsedResult = null;

        try {
          parsedResult = JSON.parse(responseText);
        } catch {
          parsedResult = { raw: responseText };
        }

        setResult(parsedResult);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(err.message || 'Unable to analyze the image right now.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    runAnalysis();

    return () => {
      isActive = false;
    };
  }, [base64Image]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analysis</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#5B3FA3" />
          <Text style={styles.statusText}>Analyzing image...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error && result ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Objects" content={result.objects} />
          <Section title="Context" content={result.context} />
          <Section title="Activities" content={result.activities} />
          <Section title="Recommendations" content={result.recommendations} />
        </ScrollView>
      ) : null}
    </View>
  );
}

function Section({ title, content }) {
  const displayContent = Array.isArray(content)
    ? content.join(', ')
    : content || 'No details available.';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{displayContent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backText: {
    color: '#5B3FA3',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  headerSpacer: {
    width: 48,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: '#c0392b',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#222',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
});
