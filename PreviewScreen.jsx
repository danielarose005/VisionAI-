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
    navigation.navigate('Result', { base64Image });
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.preview} />

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
