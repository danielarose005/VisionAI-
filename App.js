import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';

const PERSONAS = {
  general: {
    label: 'General',
    instruction:
      'You are a careful mobile vision assistant. Describe the scene plainly and give practical recommendations.',
  },
  safety: {
    label: 'Safety',
    instruction:
      'You are a safety reviewer. Focus on visible risks, hazards, and sensible next steps without inventing details.',
  },
  organizer: {
    label: 'Organizer',
    instruction:
      'You are an organization coach. Focus on objects, clutter, grouping, and how someone could tidy or use the space.',
  },
};

const EMPTY_RESULT = {
  title: 'Untitled scene',
  summary: '',
  objects: [],
  context: '',
  activity: '',
  recommendations: [],
  safetyNotes: [],
  confidence: 'unknown',
};

export default function App() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [screen, setScreen] = useState('camera');
  const [photo, setPhoto] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [persona, setPersona] = useState('general');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();

  const isWide = width >= 760;
  const platformText =
    Platform.OS === 'ios'
      ? 'iOS camera permissions are managed by the system prompt.'
      : Platform.OS === 'android'
        ? 'Android camera permissions are managed by the system prompt.'
        : 'Web camera access depends on your browser permissions.';

  const canAnalyze = Boolean(photo?.base64 || getDataUrlBase64(photo?.uri));

  const result = useMemo(() => ({ ...EMPTY_RESULT, ...analysis }), [analysis]);

  async function capturePhoto() {
    if (!cameraRef.current || !isCameraReady) {
      return;
    }

    try {
      setError('');
      const picture = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.72,
        exif: false,
      });
      setPhoto(picture);
      setAnalysis(null);
      setScreen('preview');
    } catch (captureError) {
      setError(captureError.message || 'Could not capture a photo.');
    }
  }

  async function analyzePhoto() {
    if (!photo || !canAnalyze) {
      setError('Capture a photo before analyzing.');
      return;
    }

    if (!GEMINI_KEY || GEMINI_KEY === 'your_key_here') {
      setError('Add EXPO_PUBLIC_GEMINI_KEY to .env, restart Expo, then try again.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const body = buildGeminiBody(photo, persona);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error?.message || 'Gemini analysis request failed.';
        throw new Error(message);
      }

      const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseJsonFromModel(rawText);
      setAnalysis(parsed);
      setScreen('result');
    } catch (analysisError) {
      setError(analysisError.message || 'Could not analyze this photo.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetCapture() {
    setPhoto(null);
    setAnalysis(null);
    setError('');
    setScreen('camera');
  }

  if (!permission) {
    return (
      <AppShell>
        <CenteredPanel title="Preparing camera" subtitle="Checking camera permission status..." />
      </AppShell>
    );
  }

  if (!permission.granted) {
    return (
      <AppShell>
        <View style={styles.permissionPanel}>
          <Text style={styles.kicker}>VisionAI</Text>
          <Text style={styles.title}>Camera access needed</Text>
          <Text style={styles.bodyText}>
            This app captures a real photo and sends it to Gemini for structured visual analysis.
          </Text>
          <Text style={styles.hint}>{platformText}</Text>
          <Button label="Grant Camera Access" onPress={requestPermission} variant="primary" />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {screen === 'camera' && (
        <View style={styles.cameraScreen}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>VisionAI</Text>
              <Text style={styles.title}>Camera analysis</Text>
            </View>
            <Text style={styles.platformBadge}>{Platform.OS}</Text>
          </View>

          <View style={styles.cameraFrame}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              mode="picture"
              onCameraReady={() => setIsCameraReady(true)}
              onMountError={(event) => setError(event?.nativeEvent?.message || event?.message || 'Camera failed to start.')}
            />
            <View pointerEvents="none" style={styles.focusBox} />
            <View style={styles.cameraControls}>
              <Text style={styles.cameraHint}>{platformText}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capture photo"
                disabled={!isCameraReady}
                onPress={capturePhoto}
                style={({ pressed }) => [
                  styles.shutterOuter,
                  pressed && styles.pressed,
                  !isCameraReady && styles.disabled,
                ]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      )}

      {screen === 'preview' && photo && (
        <ScrollView contentContainerStyle={[styles.content, isWide && styles.wideContent]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Captured photo</Text>
              <Text style={styles.title}>Preview</Text>
            </View>
            <Button label="Retake" onPress={resetCapture} />
          </View>

          <Image source={{ uri: photo.uri }} style={[styles.previewImage, isWide && styles.widePreview]} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis persona</Text>
            <View style={styles.segmentedControl}>
              {Object.entries(PERSONAS).map(([key, value]) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => setPersona(key)}
                  style={[styles.segment, persona === key && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, persona === key && styles.segmentTextActive]}>
                    {value.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <Button label="Analyze Photo" onPress={analyzePhoto} variant="primary" disabled={isAnalyzing} />
            <Button label="Back to Camera" onPress={resetCapture} />
          </View>

          {isAnalyzing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.bodyText}>Sending image to Gemini...</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {screen === 'result' && (
        <ScrollView contentContainerStyle={[styles.content, isWide && styles.wideContent]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>{PERSONAS[persona].label} analysis</Text>
              <Text style={styles.title}>{result.title}</Text>
            </View>
            <Button label="New Photo" onPress={resetCapture} />
          </View>

          {photo ? (
            <Image source={{ uri: photo.uri }} style={[styles.previewImage, styles.resultImage]} />
          ) : null}

          <ResultSection title="Summary" content={result.summary} />
          <ResultSection title="Objects" items={result.objects} />
          <ResultSection title="Context" content={result.context} />
          <ResultSection title="Activity" content={result.activity} />
          <ResultSection title="Recommendations" items={result.recommendations} />
          <ResultSection title="Safety notes" items={result.safetyNotes} />
          <Text style={styles.confidence}>Confidence: {result.confidence}</Text>

          <View style={styles.actionRow}>
            <Button label="Analyze Again" onPress={analyzePhoto} disabled={isAnalyzing} />
            <Button label="Retake" onPress={resetCapture} variant="primary" />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      )}
    </AppShell>
  );
}

function buildGeminiBody(photo, persona) {
  const base64Data = photo.base64 || getDataUrlBase64(photo.uri);
  const mimeType = photo.uri?.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

  return {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${PERSONAS[persona].instruction}

Return only valid JSON with this exact shape:
{
  "title": "short scene title",
  "summary": "two sentence overview",
  "objects": ["visible object 1", "visible object 2"],
  "context": "where this appears to be and why",
  "activity": "what seems to be happening",
  "recommendations": ["useful recommendation"],
  "safetyNotes": ["visible safety note, or none"],
  "confidence": "low, medium, or high"
}

Base every field only on visible evidence in the image.`,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.25,
      response_mime_type: 'application/json',
    },
  };
}

function parseJsonFromModel(text) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  const jsonText = start >= 0 && end >= 0 ? withoutFence.slice(start, end + 1) : withoutFence;
  const parsed = JSON.parse(jsonText);

  return {
    ...EMPTY_RESULT,
    ...parsed,
    objects: normalizeList(parsed.objects),
    recommendations: normalizeList(parsed.recommendations),
    safetyNotes: normalizeList(parsed.safetyNotes),
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function getDataUrlBase64(uri) {
  if (!uri?.startsWith('data:image/')) {
    return '';
  }

  return uri.split(',')[1] || '';
}

function AppShell({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {children}
    </SafeAreaView>
  );
}

function CenteredPanel({ title, subtitle }) {
  return (
    <View style={styles.permissionPanel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.bodyText}>{subtitle}</Text>
    </View>
  );
}

function Button({ label, onPress, variant = 'secondary', disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'primary' && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function ResultSection({ title, content, items }) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasContent = typeof content === 'string' && content.trim().length > 0;

  if (!hasItems && !hasContent) {
    return null;
  }

  return (
    <View style={styles.resultSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasContent ? <Text style={styles.bodyText}>{content}</Text> : null}
      {hasItems
        ? items.map((item, index) => (
            <View key={`${title}-${index}`} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.bodyText}>{item}</Text>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#12151B',
  },
  cameraScreen: {
    flex: 1,
    padding: 18,
    gap: 16,
  },
  content: {
    padding: 18,
    gap: 18,
  },
  wideContent: {
    alignSelf: 'center',
    width: 720,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  kicker: {
    color: '#7DD3C7',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 4,
  },
  bodyText: {
    color: '#D9E0EA',
    fontSize: 16,
    lineHeight: 23,
  },
  hint: {
    color: '#AEB8C7',
    fontSize: 14,
    lineHeight: 20,
  },
  platformBadge: {
    backgroundColor: '#273241',
    borderRadius: 8,
    color: '#D9E0EA',
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 7,
    textTransform: 'uppercase',
  },
  permissionPanel: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  cameraFrame: {
    flex: 1,
    backgroundColor: '#05070A',
    borderColor: '#313B4A',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  focusBox: {
    alignSelf: 'center',
    borderColor: 'rgba(125, 211, 199, 0.72)',
    borderRadius: 8,
    borderWidth: 2,
    height: '44%',
    position: 'absolute',
    top: '22%',
    width: '72%',
  },
  cameraControls: {
    alignItems: 'center',
    bottom: 24,
    gap: 16,
    left: 18,
    position: 'absolute',
    right: 18,
  },
  cameraHint: {
    backgroundColor: 'rgba(18, 21, 27, 0.78)',
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 9,
    textAlign: 'center',
  },
  shutterOuter: {
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.18)',
    borderColor: '#F8FAFC',
    borderRadius: 42,
    borderWidth: 4,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  shutterInner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 27,
    height: 54,
    width: 54,
  },
  previewImage: {
    alignSelf: 'center',
    aspectRatio: 3 / 4,
    backgroundColor: '#05070A',
    borderRadius: 8,
    width: '100%',
  },
  widePreview: {
    width: 420,
  },
  resultImage: {
    aspectRatio: 16 / 10,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  segmentedControl: {
    backgroundColor: '#202938',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: '#7DD3C7',
  },
  segmentText: {
    color: '#D9E0EA',
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#12151B',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#273241',
    borderRadius: 8,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPrimary: {
    backgroundColor: '#F4B860',
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonTextPrimary: {
    color: '#15100A',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
  errorText: {
    backgroundColor: '#4A1F25',
    borderRadius: 8,
    color: '#FFD9DE',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  resultSection: {
    backgroundColor: '#1A202B',
    borderColor: '#2D3748',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  bullet: {
    backgroundColor: '#7DD3C7',
    borderRadius: 4,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  confidence: {
    color: '#AEB8C7',
    fontSize: 14,
    fontWeight: '700',
  },
});
