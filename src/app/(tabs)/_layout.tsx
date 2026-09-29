import React from 'react';
import { Tabs } from 'expo-router';
import { Alert, Text, Platform } from 'react-native';
import { GeoPhotosProvider, useGeoPhotos } from '@/context/GeoPhotosContext';
import { useShake } from '@/hooks/useShake';

function TabsNavigator() {
  const { clearAll, photos } = useGeoPhotos();

  // R4: Custom hook useShake - al agitar el teléfono, un Alert pregunta si se borran todas las fotos
  useShake(() => {
    if (photos.length === 0) {
      Alert.alert('GeoCam', 'No hay fotos guardadas para borrar.');
      return;
    }
    Alert.alert(
      'Borrar todas las fotos',
      `¿Deseas eliminar permanentemente las ${photos.length} fotos guardadas? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todas',
          style: 'destructive',
          onPress: () => clearAll(),
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
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarBadge: photos.length > 0 ? photos.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#10b981',
            color: '#052e16',
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20 }}>🗺️</Text>
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <GeoPhotosProvider>
      <TabsNavigator />
    </GeoPhotosProvider>
  );
}
