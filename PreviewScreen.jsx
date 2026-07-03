import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { imageToBase64 } from './lib/gemini';

export default function PreviewScreen({ route, navigation }) {
  const { photoUri } = route.params ?? {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  async function handleAnalyze() {
    if (!photoUri) {
      return;
    }

    const base64Image = await imageToBase64(photoUri);
    navigation.navigate('Result', { base64Image, promptKey: 'academic' });
  }

  async function goAnalyze(personaKey) {
    if (!photoUri) return;
    const base64Image = await imageToBase64(photoUri);
    navigation.navigate('Result', { base64Image, promptKey: personaKey });
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
        <TouchableOpacity style={[styles.personaButton, styles.academicButton]} onPress={() => goAnalyze('academic')}>
          <Text style={styles.personaLabel}>Academic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.personaButton, styles.safetyButton]} onPress={() => goAnalyze('safety')}>
          <Text style={styles.personaLabel}>Safety</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.personaButton, styles.inventoryButton]} onPress={() => goAnalyze('inventory')}>
          <Text style={styles.personaLabel}>Inventory</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.retakeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
          <Text style={styles.buttonText}>Academic</Text>
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
  previewWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    backgroundColor: '#11152B',
  },
  personaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  personaButton: {
    flex: 1,
    paddingVertical: 12,
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
