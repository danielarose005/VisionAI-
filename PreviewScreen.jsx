import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { imageToBase64 } from './lib/gemini';

export default function PreviewScreen({ route, navigation }) {
  const { photoUri } = route.params ?? {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    maybeAutoAnalyze();
  }, [photoUri, route.params?.autoAnalyze]);

  async function analyzeWithPersona(personaKey) {
    if (!photoUri) {
      setError('No photo available to analyze.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const base64Image = await imageToBase64(photoUri);
      if (!base64Image) {
        throw new Error('Failed to convert image to base64.');
      }

      navigation.navigate('Result', { base64Image, promptKey: personaKey, photoUri });
    } catch (err) {
      console.warn('Analyze failed:', err);
      setError('Unable to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleAnalyze() {
    analyzeWithPersona('academic');
  }

  function goAnalyze(personaKey) {
    analyzeWithPersona(personaKey);
  }

  async function maybeAutoAnalyze() {
    if (!photoUri || !route.params?.autoAnalyze) return;
    const base64Image = await imageToBase64(photoUri);
    navigation.replace('Result', { base64Image, promptKey: 'academic', photoUri });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}> 
      <View style={styles.heroRow}>
        <Text style={styles.title}>Preview your capture</Text>
        <Text style={styles.subtitle}>Choose a persona and analyze the scene.</Text>
      </View>

      <View style={styles.previewWrapper}>
        <Image
          source={{ uri: photoUri }}
          style={[styles.preview, { maxWidth: isTablet ? 680 : '100%' }]}
        />
      </View>

      <Text style={styles.personaPrompt}>Tap a persona to shape the analysis tone.</Text>

      <View style={styles.personaRow}>
        <TouchableOpacity style={[styles.personaButton, styles.academicButton]} onPress={() => goAnalyze('academic')} disabled={loading}>
          <Text style={styles.personaLabel}>Academic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.personaButton, styles.safetyButton]} onPress={() => goAnalyze('safety')} disabled={loading}>
          <Text style={styles.personaLabel}>Safety</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.personaButton, styles.inventoryButton]} onPress={() => goAnalyze('inventory')} disabled={loading}>
          <Text style={styles.personaLabel}>Inventory</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.retakeButton} onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.analyzeButton, loading ? styles.disabledButton : null]} onPress={handleAnalyze} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090E21',
    paddingTop: 18,
  },
  heroRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#C7D1FF',
    fontSize: 14,
    lineHeight: 20,
  },
  previewWrapper: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 700,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#121A34',
    marginHorizontal: 16,
    shadowColor: '#3A54FF',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 32,
    elevation: 14,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#11152B',
  },
  personaPrompt: {
    color: '#C7D1FF',
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  personaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  personaButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  academicButton: {
    backgroundColor: '#4F74FF',
  },
  safetyButton: {
    backgroundColor: '#FF6F61',
  },
  inventoryButton: {
    backgroundColor: '#3AD29F',
  },
  personaLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  retakeButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#1E2645',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  analyzeButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#7C5DFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
