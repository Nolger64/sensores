import React from 'react';
import { Tabs } from 'expo-router';
import { Alert, Text, Platform } from 'react-native';
import { usePhotos } from '@/hooks/usePhotos';
import { useShake } from '@/hooks/useShake';

export default function TabsLayout() {
  const { photos, clearAll } = usePhotos();

  // R4 / T5: useShake llama a clearAll del repositorio con confirmación nativa
  useShake(() => {
    if (photos.length === 0) {
      Alert.alert('GeoCam', 'No hay fotos guardadas para borrar.');
      return;
    }
    Alert.alert(
      'Borrar todas las fotos',
      `¿Deseas eliminar permanentemente las ${photos.length} fotos guardadas y sus archivos del almacenamiento? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todas',
          style: 'destructive',
          onPress: () => {
            clearAll().catch((err) => {
              console.warn('Error clearing photos:', err);
              Alert.alert('Error', 'No se pudieron eliminar las fotos.');
            });
          },
        },
      ]
    );
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#262626',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#737373',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="geocam"
        options={{
          title: 'GeoCam',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20 }}>📷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="galeria"
        options={{
          title: 'Galería',
          tabBarBadge: photos.length > 0 ? photos.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#10b981',
            color: '#052e16',
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20 }}>🖼️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20 }}>🗺️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
