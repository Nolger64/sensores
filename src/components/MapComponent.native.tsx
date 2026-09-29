import React, { useRef, useEffect, useCallback } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';
import type { GeoPhoto } from '@/types/geo';

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
  const mapRef = useRef<MapView>(null);

  // Auto-focus on photos or user location
  const focusOnPhotos = useCallback(() => {
    if (!mapRef.current) return;
    if (photosWithCoords.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: photosWithCoords[0].coords.latitude,
          longitude: photosWithCoords[0].coords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        600
      );
    } else if (photosWithCoords.length > 1) {
      const coords = photosWithCoords.map((p) => ({
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 90, right: 70, bottom: 180, left: 70 },
        animated: true,
      });
    } else if (defaultCenter.latitude !== 0) {
      mapRef.current.animateToRegion(defaultCenter, 600);
    }
  }, [photosWithCoords, defaultCenter]);

  // Center on user position
  const focusOnUser = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: defaultCenter.latitude,
        longitude: defaultCenter.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600
    );
  }, [defaultCenter]);

  // Zoom controls
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!mapRef.current) return;
    mapRef.current.getCamera().then((camera) => {
      if (!camera) return;
      const currentZoom = camera.zoom ?? 15;
      const newZoom = direction === 'in' ? currentZoom + 1.2 : currentZoom - 1.2;
      mapRef.current?.animateCamera({ zoom: newZoom }, { duration: 300 });
    });
  }, []);

  // Animate map when new photos arrive or initial coordinates are found
  useEffect(() => {
    const timer = setTimeout(() => {
      focusOnPhotos();
    }, 500);
    return () => clearTimeout(timer);
  }, [photosWithCoords.length, defaultCenter.latitude, defaultCenter.longitude, focusOnPhotos]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={defaultCenter}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        mapType="standard"
      >
        {/* OpenStreetMap tile layer fallback if Google Maps API key is not present */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />

        {photosWithCoords.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.coords.latitude,
              longitude: photo.coords.longitude,
            }}
            pinColor={photo.source === 'gallery' ? '#0284c7' : '#10b981'}
            title={photo.source === 'gallery' ? 'Galería' : 'Cámara'}
            description={`${photo.coords.latitude.toFixed(4)}, ${photo.coords.longitude.toFixed(4)}`}
            onPress={() => onSelectPhoto(photo)}
          >
            {/* Custom pin with thumbnail */}
            <View style={styles.pinWrapper}>
              <View
                style={[
                  styles.pinCard,
                  photo.source === 'gallery' ? styles.galleryBorder : styles.cameraBorder,
                ]}
              >
                <Image source={{ uri: photo.uri }} style={styles.pinThumb} />
                <View
                  style={[
                    styles.pinBadge,
                    photo.source === 'gallery' ? styles.galleryBadge : styles.cameraBadge,
                  ]}
                >
                  <Text style={styles.pinBadgeText}>
                    {photo.source === 'gallery' ? '🖼️' : '📷'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.pinArrow,
                  photo.source === 'gallery' ? styles.galleryArrow : styles.cameraArrow,
                ]}
              />
            </View>

            <Callout tooltip onPress={() => onSelectPhoto(photo)}>
              <View style={styles.calloutCard}>
                <Image source={{ uri: photo.uri }} style={styles.calloutImage} />
                <View style={styles.calloutInfo}>
                  <Text style={styles.calloutTitle}>
                    {photo.source === 'gallery' ? '🖼️ Desde Galería' : '📷 Foto de Cámara'}
                  </Text>
                  <Text style={styles.calloutCoords}>
                    {photo.coords.latitude.toFixed(5)}, {photo.coords.longitude.toFixed(5)}
                  </Text>
                  <Text style={styles.calloutDate}>
                    {new Date(photo.createdAt).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </Text>
                  <Text style={styles.calloutTapHint}>Toca para ver en Google Maps</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Floating Action Controls */}
      <View style={styles.mapControls}>
        {photosWithCoords.length > 0 && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={focusOnPhotos}
            activeOpacity={0.8}
          >
            <Text style={styles.controlIcon}>📍</Text>
            <Text style={styles.controlLabel}>Ver Fotos</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.controlButton}
          onPress={focusOnUser}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>🎯</Text>
          <Text style={styles.controlLabel}>Mi Posición</Text>
        </TouchableOpacity>

        <View style={styles.zoomGroup}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom('in')}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom('out')}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 66,
  },
  pinCard: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2.5,
    backgroundColor: '#18181b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 6,
  },
  cameraBorder: {
    borderColor: '#10b981',
  },
  galleryBorder: {
    borderColor: '#0284c7',
  },
  pinThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  pinBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  cameraBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.95)',
  },
  galleryBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.95)',
  },
  pinBadgeText: {
    fontSize: 9,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  cameraArrow: {
    borderTopColor: '#10b981',
  },
  galleryArrow: {
    borderTopColor: '#0284c7',
  },
  calloutCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 10,
    width: 200,
    borderWidth: 1,
    borderColor: '#3f3f46',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  calloutImage: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutInfo: {
    gap: 2,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  calloutCoords: {
    fontSize: 11,
    color: '#34d399',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  calloutDate: {
    fontSize: 10,
    color: '#a1a1aa',
  },
  calloutTapHint: {
    fontSize: 10,
    color: '#38bdf8',
    marginTop: 4,
    fontWeight: '500',
  },
  mapControls: {
    position: 'absolute',
    right: 14,
    top: 60,
    gap: 10,
    alignItems: 'flex-end',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  controlIcon: {
    fontSize: 14,
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  zoomGroup: {
    backgroundColor: 'rgba(24, 24, 27, 0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  zoomButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
});
