import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const insets = useSafeAreaInsets();
  const shadowStyle = Platform.select({
    ios: styles.shadowIos,
    android: styles.shadowAndroid,
  });

  async function takePicture() {
    if (!cameraRef.current) {
      return;
    }

    const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhoto(result.uri);
    console.log('Captured photo:', result.uri);
    navigation.navigate('Preview', { photoUri: result.uri });
  }

  if (!permission) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top + 20 }]}> 
        <Text style={styles.permissionTitle}>Camera access required</Text>
        <Text style={styles.permissionText}>
          {Platform.OS === 'ios'
            ? 'VisionAI needs camera access. Tap below, then choose Allow in the dialog.'
            : 'VisionAI needs camera access. Tap below to grant permission.'}
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { top: insets.top + 16 }]}> 
        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <TouchableOpacity
        style={[styles.captureButton, shadowStyle, { bottom: insets.bottom + 24 }]}
        onPress={takePicture}
      >
        <Text style={styles.captureButtonText}>Capture</Text>
      </TouchableOpacity>
      {photo ? (
        <View style={[styles.photoNotice, { top: insets.top + 16 }]}> 
          <Text style={styles.photoNoticeText}>Photo captured</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090E21',
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#7C5DFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 36,
  },
  captureButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#08101F',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#D9E0FF',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#7C5DFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  photoNotice: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 22, 44, 0.85)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  photoNoticeText: {
    color: '#fff',
    fontWeight: '700',
  },
  shadowIos: {
    shadowColor: '#7C5DFF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
  },
  shadowAndroid: {
    elevation: 10,
  },
  header: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
