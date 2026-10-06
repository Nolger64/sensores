import { useEffect } from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { db } from '@/db/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [success, error]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: '#0a0a0a',
        }}
      >
        <Text
          style={{
            color: '#ef4444',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
          }}
        >
          Error al preparar la base de datos
        </Text>
        <Text style={{ color: '#a3a3a3', textAlign: 'center' }}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="foto/[id]"
          options={{
            headerShown: true,
            presentation: 'card',
            title: 'Detalle de Foto',
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#fff',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
