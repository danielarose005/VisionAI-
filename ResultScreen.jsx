import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROMPTS, ANALYSIS_PROMPT, analyzeImage } from './lib/gemini';
import { saveAnalysisHistory } from './lib/supabase';

export default function ResultScreen({ route, navigation }) {
  const { base64Image, promptKey, photoUri } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historySaved, setHistorySaved] = useState(false);

  useEffect(() => {
    runAnalysis();
  }, []);

  async function runAnalysis() {
    if (!base64Image) {
      setError('No image available to analyze.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = (promptKey && PROMPTS[promptKey]) || ANALYSIS_PROMPT;
      const result = await analyzeImage(base64Image, prompt);

      if (result?.error) {
        throw new Error(`Gemini API Error: ${result.error.message} (Code: ${result.error.code})`);
      }

      const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textPart) {
        throw new Error('Empty response from Gemini (no candidate text found).');
      }

      const parsed = parseJsonText(textPart);
      setAnalysis(parsed);
      await persistAnalysis(parsed);
    } catch (err) {
      console.error('Run Analysis Error:', err);
      setError(`Could not analyze this image. ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  async function persistAnalysis(parsed) {
    try {
      await saveAnalysisHistory({
        objects: Array.isArray(parsed.objects) ? parsed.objects.join(', ') : parsed.objects || '',
        context: parsed.context || '',
        activities: parsed.activities || '',
        recommendations: parsed.recommendations || '',
      });
      setHistorySaved(true);
    } catch (err) {
      console.warn('History save failed:', err.message || err, err.details || '', err.hint || '', err);
    }
  }

  function parseJsonText(text) {
    const trimmed = text.trim();
    let jsonText = trimmed;

    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```.*\n/, '');
      jsonText = jsonText.replace(/\n```$/, '');
    }

    jsonText = jsonText.trim();
    return JSON.parse(jsonText);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5B3FA3" />
        <Text style={styles.loadingText}>Analyzing image...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={runAnalysis}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Objects</Text>
        {Array.isArray(analysis.objects) ? (
          analysis.objects.map((obj, index) => (
            <Text key={index} style={styles.listItem}>
              • {obj}
            </Text>
          ))
        ) : (
          <Text style={styles.bodyText}>{analysis.objects || 'No objects detected.'}</Text>
        )}

        <Text style={styles.sectionTitle}>Context</Text>
        <Text style={styles.bodyText}>{analysis.context}</Text>

        <Text style={styles.sectionTitle}>Activities</Text>
        <Text style={styles.bodyText}>{analysis.activities}</Text>

        <Text style={styles.sectionTitle}>Recommendations</Text>
        <Text style={styles.bodyText}>{analysis.recommendations}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C132D',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0C132D',
  },
  loadingText: {
    marginTop: 12,
    color: '#C7D1FF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF8C8C',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7C5DFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#C7D1FF',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#171F41',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 24,
    elevation: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    color: '#E6E9FF',
  },
  listItem: {
    fontSize: 15,
    marginTop: 8,
    color: '#D7E1FF',
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 15,
    marginTop: 8,
    color: '#C7D1FF',
    lineHeight: 22,
  },
  historyStatus: {
    color: '#A9F0D1',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
});
