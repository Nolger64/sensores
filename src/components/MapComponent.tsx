import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import type { GeoPhoto } from '@/types/geo';
import { openInGoogleMaps } from '@/utils/mapUtils';

export interface MapComponentProps {
  defaultCenter: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation: boolean;
  photosWithCoords: (GeoPhoto & { coords: NonNullable<GeoPhoto['coords']> })[];
  onSelectPhoto: (photo: GeoPhoto) => void;
}

export default function MapComponent({
  defaultCenter,
  showsUserLocation,
  photosWithCoords,
  onSelectPhoto,
}: MapComponentProps) {
  return (
    <View style={styles.webFallback}>
      <Text style={styles.webFallbackTitle}>Visualizador de Mapa (Web)</Text>
      <Text style={styles.webFallbackSubtitle}>
        react-native-maps se ejecuta en dispositivos físicos (iOS/Android) con Expo Go.
      </Text>
      <Text style={styles.webFallbackCoords}>
        Centro GPS: {defaultCenter.latitude.toFixed(5)}, {defaultCenter.longitude.toFixed(5)}
      </Text>
      <Text style={styles.webFallbackCount}>
        Fotos geolocalizadas ({photosWithCoords.length}):
      </Text>
      {photosWithCoords.length === 0 ? (
        <Text style={styles.emptyText}>No hay fotos con coordenadas GPS aún.</Text>
      ) : (
        <ScrollView horizontal style={styles.webMarkersList} showsHorizontalScrollIndicator={false}>
          {photosWithCoords.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.webPhotoCard}
              onPress={() => onSelectPhoto(p)}
            >
              <Image source={{ uri: p.uri }} style={styles.webPhotoThumb} />
              <Text style={styles.webPhotoCoords}>
                {p.coords.latitude.toFixed(4)}, {p.coords.longitude.toFixed(4)}
              </Text>
              <Text style={styles.webPhotoSource}>
                {p.source === 'gallery' ? '🖼️ Galería' : '📷 Cámara'}
              </Text>
              <TouchableOpacity
                style={styles.webMapsButton}
                onPress={(e) => {
                  e.stopPropagation();
                  openInGoogleMaps(
                    p.coords.latitude,
                    p.coords.longitude,
                    p.source === 'gallery' ? 'Foto de Galería' : 'Foto de Cámara'
                  );
                }}
              >
                <Text style={styles.webMapsButtonText}>🗺️ Maps</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#18181b',
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  webFallbackSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 400,
    marginBottom: 12,
  },
  webFallbackCoords: {
    fontSize: 13,
    color: '#34d399',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  webFallbackCount: {
    fontSize: 14,
    color: '#e5e5e5',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 8,
  },
  webMarkersList: {
    marginTop: 12,
    maxHeight: 150,
  },
  webPhotoCard: {
    marginRight: 12,
    alignItems: 'center',
    backgroundColor: '#27272a',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  webPhotoThumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
  },
  webPhotoCoords: {
    color: '#34d399',
    fontSize: 10,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  webPhotoSource: {
    color: '#d4d4d4',
    fontSize: 10,
    marginTop: 2,
  },
  webMapsButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  webMapsButtonText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
});
