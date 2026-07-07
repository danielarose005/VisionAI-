import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAnalysisHistory } from './lib/supabase';

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    setError(null);

    try {
      const rows = await getAnalysisHistory();
      setHistory(rows || []);
    } catch (err) {
      setError('Unable to load history. Please try again later.');
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.prompt_key || 'Analysis'}</Text>
        <Text style={styles.cardMeta}>{new Date(item.created_at).toLocaleString()}</Text>
        <Text style={styles.cardLabel}>Objects</Text>
        <Text style={styles.cardText}>{Array.isArray(item.objects) ? item.objects.join(', ') : item.objects}</Text>
        <Text style={styles.cardLabel}>Context</Text>
        <Text style={styles.cardText}>{item.context}</Text>
        <Text style={styles.cardLabel}>Activities</Text>
        <Text style={styles.cardText}>{item.activities}</Text>
        <Text style={styles.cardLabel}>Recommendations</Text>
        <Text style={styles.cardText}>{item.recommendations}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}> 
        <ActivityIndicator size="large" color="#5B3FA3" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}> 
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!history.length) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}> 
        <Text style={styles.emptyText}>No history yet. Capture and analyze a scene to save results.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}> 
      <View style={styles.headerRow}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id?.toString() ?? item.created_at}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
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
    paddingHorizontal: 24,
    backgroundColor: '#0C132D',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  closeButton: {
    backgroundColor: '#7C5DFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#121A34',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    color: '#E6E9FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardMeta: {
    color: '#A3B1FF',
    fontSize: 12,
    marginBottom: 12,
  },
  cardLabel: {
    color: '#C7D1FF',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '700',
  },
  cardText: {
    color: '#D7E1FF',
    fontSize: 14,
    lineHeight: 20,
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
  emptyText: {
    color: '#C7D1FF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});