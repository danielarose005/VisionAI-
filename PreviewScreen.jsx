import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { imageToBase64 } from './lib/gemini';

export default function PreviewScreen({ route, navigation }) {
  const { photoUri } = route.params ?? {};

  async function handleAnalyze() {
    if (!photoUri) {
      return;
    }

    const base64Image = await imageToBase64(photoUri);
    console.log('Base64 length:', base64Image.length);
    navigation.navigate('Result', { base64Image, promptKey: 'academic' });
  }

  async function goAnalyze(personaKey) {
    if (!photoUri) return;
    const base64Image = await imageToBase64(photoUri);
    navigation.navigate('Result', { base64Image, promptKey: personaKey });
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.preview} />

      <View style={styles.personaRow}>
        <TouchableOpacity onPress={() => goAnalyze('academic')}>
          <Text style={styles.personaLabel}>Academic Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goAnalyze('safety')}>
          <Text style={styles.personaLabel}>Safety Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goAnalyze('inventory')}>
          <Text style={styles.personaLabel}>Inventory Analysis</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.retakeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000',
  },
  personaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#000',
  },
  personaLabel: {
    color: '#fff',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3A3F55',
  },
  retakeButton: {
    backgroundColor: '#5A6472',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  analyzeButton: {
    backgroundColor: '#5B3FA3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
