import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCamera } from '@/hooks/useCamera';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { useGeoPhotos } from '@/context/GeoPhotosContext';
import { openInGoogleMaps } from '@/utils/mapUtils';

const { width } = Dimensions.get('window');

export default function GeoCamScreen() {
  const cam = useCamera();
  const geo = useGeoLocation({ watch: true });
  const { photos, addPhoto } = useGeoPhotos();
  const [flashAnim] = useState(new Animated.Value(0));

  const lastPhoto = photos[0] ?? null;

  if (cam.permissionState === 'checking') {
    return <View style={styles.blackBackground} />;
  }

  if (cam.permissionState !== 'granted') {
    return (
      <PermissionPrimer
        title="GeoCam necesita tu cámara"
        description="Utilizamos la cámara para capturar fotos geolocalizadas que tú decidas guardar."
        state={cam.permissionState}
        onRequest={cam.requestPermission}
        onOpenSettings={cam.openSettings}
      />
    );
  }

  const triggerShutterFlash = () => {
    flashAnim.setValue(0.7);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleCapture = async () => {
    if (cam.isCapturing) return;

    try {
      triggerShutterFlash();
      const photo = await cam.takePhoto();

      if (!photo || !photo.uri) {
        Alert.alert('Cámara', 'No se pudo capturar la imagen. Intenta presionar de nuevo.');
        return;
      }

      // Si el permiso está indeterminado, solicitar en contexto al capturar
      let coords = null;
      if (geo.permission === 'granted') {
        coords = geo.coords ?? (await geo.getCurrent());
      } else if (geo.permission === 'undetermined') {
        const granted = await geo.requestPermission();
        if (granted) {
          coords = await geo.getCurrent();
        }
      }

      addPhoto({
        id: String(Date.now()),
        uri: photo.uri,
        coords,
        source: 'camera',
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('handleCapture error on Android/iOS:', err);
      Alert.alert('Aviso', 'Error al procesar la foto.');
    }
  };

  const handleImportGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let coords = null;

        if (geo.permission === 'granted') {
          coords = geo.coords ?? (await geo.getCurrent());
        }

        addPhoto({
          id: String(Date.now()),
          uri: asset.uri,
          coords,
          source: 'gallery',
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Gallery import error:', err);
      Alert.alert('Galería', 'No se pudo importar la foto.');
    }
  };

  const isApproximateLocation =
    geo.coords && geo.coords.accuracy !== null && geo.coords.accuracy > 1000;

  return (
    <View style={styles.container}>
      {/* Vista de Cámara a pantalla completa */}
      <CameraView
        ref={cam.cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cam.facing}
        onCameraReady={cam.onCameraReady}
      />

      {/* Retícula de visor profesional tipo cámara */}
      <View style={styles.reticleContainer} pointerEvents="none">
        <View style={styles.reticleCross} />
        <View style={[styles.reticleCorner, styles.reticleTL]} />
        <View style={[styles.reticleCorner, styles.reticleTR]} />
        <View style={[styles.reticleCorner, styles.reticleBL]} />
        <View style={[styles.reticleCorner, styles.reticleBR]} />
      </View>

      {/* Flash visual de captura */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnim,
          },
        ]}
      />

      {/* Top Header con Estado de GPS y Advertencias */}
      <View style={styles.topContainer}>
        {geo.permission === 'granted' && geo.coords ? (
          <View style={styles.gpsPill}>
            <View style={styles.gpsLiveDot} />
            <View>
              <Text style={styles.gpsCoordsText}>
                {geo.coords.latitude.toFixed(5)}, {geo.coords.longitude.toFixed(5)}
              </Text>
              <Text style={styles.gpsAccuracyText}>
                Precisión GPS: ±{Math.round(geo.coords.accuracy ?? 0)} m
              </Text>
            </View>
          </View>
        ) : geo.permission === 'granted' ? (
          <View style={styles.gpsPill}>
            <View style={[styles.gpsLiveDot, styles.gpsPendingDot]} />
            <Text style={styles.gpsStatusText}>Buscando satélites GPS...</Text>
          </View>
        ) : (
          <Pressable
            onPress={geo.permission === 'blocked' ? geo.openSettings : geo.requestPermission}
            style={styles.locationBanner}
          >
            <Text style={styles.locationBannerIcon}>📍</Text>
            <View style={styles.locationBannerContent}>
              <Text style={styles.locationBannerTitle}>Ubicación no activa</Text>
              <Text style={styles.locationBannerSubtitle}>
                {geo.permission === 'blocked'
                  ? 'Permiso bloqueado. Toca para abrir Ajustes'
                  : 'Toca para etiquetar fotos en el mapa'}
              </Text>
            </View>
          </Pressable>
        )}

        {isApproximateLocation && (
          <View style={styles.approxBadge}>
            <Text style={styles.approxBadgeText}>⚠️ Ubicación aproximada (&gt;1 km)</Text>
          </View>
        )}
      </View>

      {/* Barra de Controles Inferiores Estilo Profesional */}
      <View style={styles.bottomBar}>
        {/* Miniatura de la última foto con contador y acceso directo a Google Maps */}
        {lastPhoto ? (
          <Pressable
            onPress={() => {
              if (lastPhoto.coords) {
                openInGoogleMaps(
                  lastPhoto.coords.latitude,
                  lastPhoto.coords.longitude,
                  lastPhoto.source === 'gallery' ? 'Foto de Galería' : 'Foto de Cámara'
                );
              } else {
                Alert.alert('Foto GeoCam', 'Esta foto no contiene coordenadas GPS.');
              }
            }}
            style={styles.thumbnailWrapper}
            accessibilityLabel="Ver en Google Maps"
          >
            <Image
              source={{ uri: lastPhoto.uri }}
              style={[
                styles.thumbnail,
                lastPhoto.source === 'gallery' ? styles.galleryBorder : styles.cameraBorder,
              ]}
            />
            <View
              style={[
                styles.sourceBadge,
                lastPhoto.source === 'gallery' ? styles.galleryBadge : styles.cameraBadge,
              ]}
            >
              <Text style={styles.sourceBadgeIcon}>
                {lastPhoto.source === 'gallery' ? '🖼️' : '📷'}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{photos.length}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.thumbnailPlaceholder} />
        )}

        {/* Botón de importación desde galería */}
        <Pressable
          onPress={handleImportGallery}
          style={({ pressed }) => [styles.glassButton, pressed && styles.glassButtonPressed]}
          accessibilityLabel="Importar de galería"
        >
          <Text style={styles.glassButtonIcon}>🖼️</Text>
        </Pressable>

        {/* Botón obturador moderno con doble anillo */}
        <Pressable
          onPress={handleCapture}
          disabled={cam.isCapturing}
          style={({ pressed }) => [
            styles.shutterOuter,
            pressed && styles.shutterOuterPressed,
          ]}
          accessibilityLabel="Tomar foto"
        >
          <View
            style={[
              styles.shutterInner,
              cam.isCapturing && styles.shutterInnerCapturing,
            ]}
          />
        </Pressable>

        {/* Botón alternar cámara frontal / trasera */}
        <Pressable
          onPress={cam.toggleFacing}
          style={({ pressed }) => [styles.glassButton, pressed && styles.glassButtonPressed]}
          accessibilityLabel="Girar cámara"
        >
          <Text style={styles.flipIcon}>↻</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blackBackground: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    zIndex: 20,
  },
  reticleContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCross: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  reticleCorner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  reticleTL: {
    top: '25%',
    left: '12%',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  reticleTR: {
    top: '25%',
    right: '12%',
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 8,
  },
  reticleBL: {
    bottom: '25%',
    left: '12%',
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 8,
  },
  reticleBR: {
    bottom: '25%',
    right: '12%',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },
  topContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 42,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 15,
    gap: 8,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.78)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  gpsLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  gpsPendingDot: {
    backgroundColor: '#f59e0b',
  },
  gpsStatusText: {
    color: '#e5e5e5',
    fontSize: 12,
    fontWeight: '500',
  },
  gpsCoordsText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gpsAccuracyText: {
    color: '#a1a1aa',
    fontSize: 10,
    marginTop: 1,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  locationBannerIcon: {
    fontSize: 20,
  },
  locationBannerContent: {
    flex: 1,
  },
  locationBannerTitle: {
    color: '#1c1917',
    fontSize: 13,
    fontWeight: '700',
  },
  locationBannerSubtitle: {
    color: '#44403c',
    fontSize: 11,
    marginTop: 1,
  },
  approxBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approxBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 15,
  },
  thumbnailWrapper: {
    width: 58,
    height: 58,
    position: 'relative',
  },
  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 2.5,
  },
  cameraBorder: {
    borderColor: '#10b981',
  },
  galleryBorder: {
    borderColor: '#0284c7',
  },
  sourceBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  cameraBadge: {
    backgroundColor: '#059669',
  },
  galleryBadge: {
    backgroundColor: '#0284c7',
  },
  sourceBadgeIcon: {
    fontSize: 10,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  thumbnailPlaceholder: {
    width: 58,
    height: 58,
  },
  glassButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(24, 24, 27, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  glassButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(39, 39, 42, 0.9)',
  },
  glassButtonIcon: {
    fontSize: 22,
  },
  flipIcon: {
    fontSize: 28,
    color: '#ffffff',
    lineHeight: 30,
  },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  shutterOuterPressed: {
    transform: [{ scale: 0.93 }],
    borderColor: '#10b981',
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ffffff',
  },
  shutterInnerCapturing: {
    backgroundColor: '#a1a1aa',
    transform: [{ scale: 0.85 }],
  },
});
