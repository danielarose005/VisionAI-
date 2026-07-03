import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PROMPTS, ANALYSIS_PROMPT, analyzeImage } from './lib/gemini';

export default function ResultScreen({ route, navigation }) {
  const { base64Image, promptKey } = route.params ?? {};
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textPart) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = parseJsonText(textPart);
      setAnalysis(parsed);
    } catch (err) {
      setError('Could not analyze this image. Please try again.');
    } finally {
      setLoading(false);
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f7f7fb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f7f7fb',
  },
  loadingText: {
    marginTop: 12,
    color: '#5A6472',
    fontSize: 16,
  },
  errorText: {
    color: '#B3261E',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5B3FA3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#1F2A44',
  },
  listItem: {
    fontSize: 15,
    marginTop: 4,
    color: '#333',
  },
  bodyText: {
    fontSize: 15,
    marginTop: 4,
    color: '#2B2F38',
  },
});
