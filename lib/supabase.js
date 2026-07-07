import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_PUBLISHABLE_KEY ?? '');

export async function saveAnalysisHistory(entry) {
  console.log("Saving:", entry);

  const { data, error } = await supabase
    .from("analysis_history")
    .insert([entry])
    .select();

  console.log("Data:", data);
  console.log("Error:", error);

  if (error) {
    throw error;
  }

  return data;
}

export async function getAnalysisHistory() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_URL.includes('your-project-ref')
  ) {
    console.warn('Supabase is not configured. Returning empty history.');
    return [];
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data;
}
