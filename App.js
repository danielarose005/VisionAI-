import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CameraScreen from './CameraScreen';
import PreviewScreen from './PreviewScreen';
import ResultScreen from './ResultScreen';
import HistoryScreen from './HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Camera" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Preview" component={PreviewScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
