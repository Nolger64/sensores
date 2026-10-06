import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { photosRepo } from '@/db/repositories/photos';
import { useAlbums } from '@/hooks/useAlbums';
import { openInGoogleMaps } from '@/utils/mapUtils';

const { width } = Dimensions.get('window');

interface PhotoDetails {
  id: number;
  uri: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  source: 'camera' | 'gallery';
  albumId: number | null;
  albumName?: string | null;
  note: string | null;
  favorite: boolean;
  createdAt: Date;
}

export default function FotoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photoId = id ? Number(id) : null;

  const { albums } = useAlbums();
  const [photo, setPhoto] = useState<PhotoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!photoId) return;

    photosRepo
      .findById(photoId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setPhoto(data);
          setNoteText(data.note ?? '');
        } else {
          Alert.alert('No encontrada', 'La foto especificada no existe.');
          router.back();
        }
      })
      .catch((_err) => {
        if (!isMounted) return;
        Alert.alert('Error', 'No se pudieron cargar los datos de la foto.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [photoId]);

  // C3: Marcar/desmarcar como favorita
  const handleToggleFavorite = async () => {
    if (!photo || !photoId) return;
    const nextFavorite = !photo.favorite;
    try {
      await photosRepo.update(photoId, { favorite: nextFavorite });
      setPhoto((prev) => (prev ? { ...prev, favorite: nextFavorite } : null));
    } catch (_err) {
      Alert.alert('Error', 'No se pudo actualizar el estado de favorita.');
    }
  };

  // C3: Guardar nota
  const handleSaveNote = async () => {
    if (!photo || !photoId) return;
    setSavingNote(true);
    try {
      const trimmed = noteText.trim();
      await photosRepo.update(photoId, { note: trimmed || null });
      setPhoto((prev) => (prev ? { ...prev, note: trimmed || null } : null));
      Alert.alert('Éxito', 'Nota actualizada correctamente.');
    } catch (_err) {
      Alert.alert('Error', 'No se pudo guardar la nota.');
    } finally {
      setSavingNote(false);
    }
  };

  // C3: Moverla de álbum
  const handleChangeAlbum = async (newAlbumId: number | null) => {
    if (!photo || !photoId) return;
    try {
      await photosRepo.update(photoId, { albumId: newAlbumId });
      const albumObj = albums.find((a) => a.id === newAlbumId);
      setPhoto((prev) =>
        prev
          ? {
              ...prev,
              albumId: newAlbumId,
              albumName: albumObj ? albumObj.name : null,
            }
          : null
      );
    } catch (_err) {
      Alert.alert('Error', 'No se pudo cambiar el álbum.');
    }
  };

  // C3 & C5: Eliminar con confirmación (elimina fila en SQLite y archivo en disco)
  const handleDelete = () => {
    if (!photo || !photoId) return;
    Alert.alert(
      'Eliminar Foto',
      '¿Deseas eliminar permanentemente esta foto y su archivo local? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await photosRepo.remove(photoId);
              router.back();
            } catch (_err) {
              Alert.alert('Error', 'No se pudo eliminar la foto.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!photo) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>Foto no encontrada</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: photo.note ? photo.note.slice(0, 20) : 'Detalle de Foto',
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#ffffff',
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerStarBtn}>
              <Text style={styles.headerStarText}>{photo.favorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Foto principal */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlayBadge}>
            <Text style={styles.imageOverlayBadgeText}>
              {photo.source === 'gallery' ? '🖼️ Galería' : '📷 Cámara'}
            </Text>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.quickBar}>
          <TouchableOpacity
            style={[styles.quickBtn, photo.favorite && styles.quickBtnFav]}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.quickBtnIcon}>{photo.favorite ? '⭐' : '☆'}</Text>
            <Text style={[styles.quickBtnText, photo.favorite && styles.quickBtnTextFav]}>
              {photo.favorite ? 'Favorita' : 'Marcar Favorita'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtnDanger} onPress={handleDelete}>
            <Text style={styles.quickBtnIcon}>🗑️</Text>
            <Text style={styles.quickBtnTextDanger}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Edición de Nota (CRUD Update) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nota de la Foto</Text>
          <Text style={styles.sectionSubtitle}>
            Añade una descripción para buscarla fácilmente en la galería.
          </Text>
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={3}
            placeholder="Escribe una nota para esta foto..."
            placeholderTextColor="#737373"
            value={noteText}
            onChangeText={setNoteText}
          />
          <TouchableOpacity
            style={[styles.saveNoteBtn, savingNote && styles.saveNoteBtnDisabled]}
            onPress={handleSaveNote}
            disabled={savingNote}
          >
            <Text style={styles.saveNoteText}>
              {savingNote ? 'Guardando...' : 'Guardar Nota'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Álbum (Relación con albums) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Álbum Asignado</Text>
          <Text style={styles.sectionSubtitle}>
            Organiza esta captura dentro de una colección.
          </Text>
          <View style={styles.albumChipsWrap}>
            <TouchableOpacity
              style={[
                styles.albumSelectChip,
                photo.albumId === null && styles.albumSelectChipActive,
              ]}
              onPress={() => handleChangeAlbum(null)}
            >
              <Text
                style={[
                  styles.albumSelectChipText,
                  photo.albumId === null && styles.albumSelectChipTextActive,
                ]}
              >
                Sin álbum
              </Text>
            </TouchableOpacity>

            {albums.map((a) => {
              const isSelected = photo.albumId === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.albumSelectChip, isSelected && styles.albumSelectChipActive]}
                  onPress={() => handleChangeAlbum(a.id)}
                >
                  <Text
                    style={[
                      styles.albumSelectChipText,
                      isSelected && styles.albumSelectChipTextActive,
                    ]}
                  >
                    📁 {a.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sección: Metadatos y GPS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Metadatos y Geolocalización</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>ID:</Text>
            <Text style={styles.metaValue}>#{photo.id}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha:</Text>
            <Text style={styles.metaValue}>
              {new Date(photo.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Ubicación:</Text>
            <Text style={styles.metaValue}>
              {photo.latitude !== null && photo.longitude !== null
                ? `${photo.latitude.toFixed(5)}, ${photo.longitude.toFixed(5)}`
                : 'No registrada'}
            </Text>
          </View>
          {photo.accuracy !== null && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Precisión GPS:</Text>
              <Text style={styles.metaValue}>±{Math.round(photo.accuracy)} m</Text>
            </View>
          )}

          {photo.latitude !== null && photo.longitude !== null && (
            <TouchableOpacity
              style={styles.mapsButton}
              onPress={() =>
                openInGoogleMaps(
                  photo.latitude!,
                  photo.longitude!,
                  photo.note || 'Foto GeoCam'
                )
              }
            >
              <Text style={styles.mapsButtonIcon}>🗺️</Text>
              <Text style={styles.mapsButtonText}>Abrir en Google Maps</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  notFoundText: {
    color: '#a3a3a3',
    fontSize: 16,
  },
  headerStarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerStarText: {
    fontSize: 22,
  },
  imageContainer: {
    width: width,
    height: width * 0.95,
    backgroundColor: '#171717',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  imageOverlayBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1917',
    borderWidth: 1,
    borderColor: '#292524',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  quickBtnFav: {
    backgroundColor: '#78350f',
    borderColor: '#b45309',
  },
  quickBtnIcon: {
    fontSize: 18,
  },
  quickBtnText: {
    color: '#d6d3d1',
    fontWeight: '700',
    fontSize: 13,
  },
  quickBtnTextFav: {
    color: '#fef3c7',
  },
  quickBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  quickBtnTextDanger: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: '#141414',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 12,
  },
  saveNoteBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveNoteBtnDisabled: {
    opacity: 0.6,
  },
  saveNoteText: {
    color: '#052e16',
    fontWeight: '700',
    fontSize: 14,
  },
  albumChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  albumSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#404040',
  },
  albumSelectChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  albumSelectChipText: {
    color: '#d4d4d4',
    fontSize: 12,
    fontWeight: '600',
  },
  albumSelectChipTextActive: {
    color: '#052e16',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  metaLabel: {
    color: '#737373',
    fontSize: 13,
  },
  metaValue: {
    color: '#e5e5e5',
    fontSize: 13,
    fontWeight: '500',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  mapsButtonIcon: {
    fontSize: 18,
  },
  mapsButtonText: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 14,
  },
});
