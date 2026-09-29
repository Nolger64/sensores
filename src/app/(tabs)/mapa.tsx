import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useGeoPhotos } from '@/context/GeoPhotosContext';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import type { GeoPhoto } from '@/types/geo';
import MapComponent from '@/components/MapComponent';
import { openInGoogleMaps } from '@/utils/mapUtils';

export default function MapaScreen() {
  const { photos, removePhoto } = useGeoPhotos();
  const geo = useGeoLocation({ watch: true });
  const [selectedPhoto, setSelectedPhoto] = useState<GeoPhoto | null>(null);

  const photosWithCoords = useMemo(
    () =>
      photos.filter(
        (p): p is GeoPhoto & { coords: NonNullable<GeoPhoto['coords']> } =>
          p.coords !== null
      ),
    [photos]
  );

  const photosWithoutCoords = useMemo(
    () => photos.filter((p) => p.coords === null),
    [photos]
  );

  // Region logic: user's live position -> last photo with coords -> default
  const defaultCenter = useMemo(() => {
    if (geo.coords) {
      return {
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    if (photosWithCoords.length > 0) {
      return {
        latitude: photosWithCoords[0].coords.latitude,
        longitude: photosWithCoords[0].coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    return {
      latitude: 11.5117,
      longitude: -72.871,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [geo.coords, photosWithCoords]);

  const confirmDelete = (photo: GeoPhoto) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Deseas eliminar permanentemente esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removePhoto(photo.id);
            if (selectedPhoto?.id === photo.id) {
              setSelectedPhoto(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenGoogleMaps = (photo: GeoPhoto) => {
    if (!photo.coords) {
      Alert.alert('Sin GPS', 'Esta foto fue tomada sin coordenadas registradas.');
      return;
    }
    openInGoogleMaps(
      photo.coords.latitude,
      photo.coords.longitude,
      photo.source === 'gallery' ? 'Foto de Galería' : 'Foto de Cámara'
    );
  };

  return (
    <View style={styles.container}>
      {/* Modern Header Bar with Stats */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Explorador GeoCam</Text>
          <View style={styles.liveLocationBadge}>
            <View
              style={[
                styles.liveDot,
                geo.permission === 'granted' ? styles.liveDotGreen : styles.liveDotAmber,
              ]}
            />
            <Text style={styles.liveLocationText}>
              {geo.permission === 'granted' ? 'GPS Activo' : 'GPS Inactivo'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{photos.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statPill, styles.statPillGreen]}>
            <Text style={[styles.statNumber, styles.statTextGreen]}>
              {photosWithCoords.length}
            </Text>
            <Text style={styles.statLabel}>En Mapa</Text>
          </View>
          <View style={[styles.statPill, styles.statPillAmber]}>
            <Text style={[styles.statNumber, styles.statTextAmber]}>
              {photosWithoutCoords.length}
            </Text>
            <Text style={styles.statLabel}>Sin GPS</Text>
          </View>
        </View>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapComponent
          defaultCenter={defaultCenter}
          showsUserLocation={geo.permission === 'granted'}
          photosWithCoords={photosWithCoords}
          onSelectPhoto={(photo) => setSelectedPhoto(photo)}
        />

        {/* Floating Selected Photo Preview Card with Google Maps button */}
        {selectedPhoto && (
          <View style={styles.selectedCard}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.selectedCardImage} />
            <View style={styles.selectedCardInfo}>
              <View style={styles.selectedSourceRow}>
                <View
                  style={[
                    styles.selectedBadge,
                    selectedPhoto.source === 'gallery'
                      ? styles.badgeGallery
                      : styles.badgeCamera,
                  ]}
                >
                  <Text style={styles.selectedBadgeText}>
                    {selectedPhoto.source === 'gallery'
                      ? '🖼️ Galería'
                      : '📷 Cámara'}
                  </Text>
                </View>
                <Text style={styles.selectedTimestamp}>
                  {new Date(selectedPhoto.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {selectedPhoto.coords ? (
                <Text style={styles.selectedCoordsText}>
                  📍 {selectedPhoto.coords.latitude.toFixed(5)}, {selectedPhoto.coords.longitude.toFixed(5)}
                </Text>
              ) : (
                <Text style={styles.selectedNoCoordsText}>
                  ⚠️ Sin coordenadas registradas
                </Text>
              )}

              {/* Botón principal: Abrir en Google Maps con Pin */}
              {selectedPhoto.coords && (
                <TouchableOpacity
                  style={styles.googleMapsButton}
                  onPress={() => handleOpenGoogleMaps(selectedPhoto)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.googleMapsIcon}>🗺️</Text>
                  <Text style={styles.googleMapsText}>Ver Pin en Google Maps</Text>
                </TouchableOpacity>
              )}

              {/* Action Buttons: Cerrar y Eliminar */}
              <View style={styles.selectedActions}>
                <TouchableOpacity
                  style={styles.closeCardButton}
                  onPress={() => setSelectedPhoto(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeCardText}>Cerrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteCardButton}
                  onPress={() => confirmDelete(selectedPhoto)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteCardText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* R3 & Android Carousel: Fotos Geolocalizadas */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Fotos Geolocalizadas</Text>
            <View style={[styles.sectionCountPill, styles.countPillGreen]}>
              <Text style={[styles.sectionCountText, styles.countTextGreen]}>
                {photosWithCoords.length}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Toca una foto para ubicarla o ver su pin en Google Maps
          </Text>
        </View>

        {photosWithCoords.length === 0 ? (
          <View style={styles.emptyPhotosContainer}>
            <Text style={styles.emptyPhotosText}>
              Aún no tienes fotos con coordenadas GPS.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosScroll}
          >
            {photosWithCoords.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={[
                  styles.photoCard,
                  selectedPhoto?.id === photo.id && styles.photoCardSelected,
                ]}
                onPress={() => setSelectedPhoto(photo)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <View
                  style={[
                    styles.photoBadge,
                    photo.source === 'gallery' ? styles.badgeGallery : styles.badgeCamera,
                  ]}
                >
                  <Text style={styles.photoBadgeText}>
                    {photo.source === 'gallery' ? '🖼️' : '📷'}
                  </Text>
                </View>

                {/* Coordenadas breves */}
                <Text style={styles.photoCoordsText}>
                  {photo.coords.latitude.toFixed(4)}, {photo.coords.longitude.toFixed(4)}
                </Text>

                {/* Botón directo de Google Maps */}
                <TouchableOpacity
                  style={styles.cardMapsAction}
                  onPress={() => handleOpenGoogleMaps(photo)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardMapsActionText}>🗺️ Maps</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* R3: Lista de Fotos Sin Ubicación */}
      {photosWithoutCoords.length > 0 && (
        <View style={styles.unlocatedContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.unlocatedTitle}>Sin ubicación</Text>
              <View style={[styles.sectionCountPill, styles.countPillAmber]}>
                <Text style={[styles.sectionCountText, styles.countTextAmber]}>
                  {photosWithoutCoords.length}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Fotos tomadas sin permiso GPS</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosScroll}
          >
            {photosWithoutCoords.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={[
                  styles.unlocatedItem,
                  selectedPhoto?.id === photo.id && styles.photoCardSelected,
                ]}
                onPress={() => setSelectedPhoto(photo)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: photo.uri }} style={styles.unlocatedThumb} />
                <View style={styles.unlocatedBadge}>
                  <Text style={styles.photoBadgeText}>
                    {photo.source === 'gallery' ? '🖼️' : '📷'}
                  </Text>
                </View>
                <Text style={styles.unlocatedTimeText}>
                  {new Date(photo.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  liveLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotGreen: {
    backgroundColor: '#10b981',
  },
  liveDotAmber: {
    backgroundColor: '#f59e0b',
  },
  liveLocationText: {
    color: '#d4d4d4',
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  statPillGreen: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  statPillAmber: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statTextGreen: {
    color: '#10b981',
  },
  statTextAmber: {
    color: '#f59e0b',
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    marginTop: 1,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    minHeight: 220,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(24, 24, 27, 0.96)',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10,
    gap: 12,
  },
  selectedCardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#27272a',
  },
  selectedCardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  selectedSourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCamera: {
    backgroundColor: '#059669',
  },
  badgeGallery: {
    backgroundColor: '#0284c7',
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedTimestamp: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  selectedCoordsText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  selectedNoCoordsText: {
    color: '#fbbf24',
    fontSize: 11,
    marginTop: 2,
  },
  googleMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    marginTop: 4,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  googleMapsIcon: {
    fontSize: 14,
  },
  googleMapsText: {
    color: '#052e16',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  closeCardButton: {
    flex: 1,
    backgroundColor: '#3f3f46',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeCardText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteCardButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteCardText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionContainer: {
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  countPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  countTextGreen: {
    color: '#10b981',
  },
  countTextAmber: {
    color: '#f59e0b',
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 1,
  },
  emptyPhotosContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyPhotosText: {
    color: '#71717a',
    fontSize: 12,
  },
  photosScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  photoCard: {
    width: 105,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    position: 'relative',
  },
  photoCardSelected: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  photoThumb: {
    width: 91,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  photoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  photoBadgeText: {
    fontSize: 9,
  },
  photoCoordsText: {
    color: '#6ee7b7',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  cardMapsAction: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    width: '100%',
    alignItems: 'center',
  },
  cardMapsActionText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  unlocatedContainer: {
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 14,
  },
  unlocatedTitle: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
  },
  unlocatedItem: {
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  unlocatedThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  unlocatedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    paddingHorizontal: 3,
  },
  unlocatedTimeText: {
    color: '#a1a1aa',
    fontSize: 10,
    marginTop: 2,
  },
});
