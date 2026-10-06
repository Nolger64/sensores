import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useFilteredPhotos } from '@/hooks/usePhotos';
import { useAlbums } from '@/hooks/useAlbums';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function GaleriaScreen() {
  const [search, setSearch] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  const { albums, createAlbum, removeAlbum } = useAlbums();

  // C4: useFilteredPhotos internamente usa useLiveQuery(query, [search, albumId, onlyFavorites])
  const { photos } = useFilteredPhotos({
    search: search.trim() ? search : undefined,
    albumId: selectedAlbumId,
    onlyFavorites,
  });

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      Alert.alert('Álbum', 'Ingresa un nombre para el álbum.');
      return;
    }
    try {
      await createAlbum(newAlbumName.trim());
      setNewAlbumName('');
      setIsModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el álbum.');
    }
  };

  const handleLongPressAlbum = (albumId: number, albumName: string) => {
    Alert.alert(
      'Gestionar Álbum',
      `¿Deseas eliminar el álbum "${albumName}"? Las fotos asignadas a este álbum NO se eliminarán (se desvincularán).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Álbum',
          style: 'destructive',
          onPress: () => {
            if (selectedAlbumId === albumId) {
              setSelectedAlbumId(null);
            }
            removeAlbum(albumId).catch(console.warn);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Galería de Fotos</Text>
        <Text style={styles.headerSubtitle}>
          {photos.length} {photos.length === 1 ? 'foto encontrada' : 'fotos encontradas'}
        </Text>
      </View>

      {/* Buscador C4: búsqueda por nota */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar fotos por nota..."
          placeholderTextColor="#737373"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros C4: Álbumes y Favoritas */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: null, name: 'Todos' },
            ...albums.map((a) => ({ id: a.id, name: a.name })),
          ]}
          keyExtractor={(item) => String(item.id ?? 'all')}
          contentContainerStyle={styles.albumsList}
          renderItem={({ item }) => {
            const isSelected = selectedAlbumId === item.id;
            return (
              <TouchableOpacity
                style={[styles.albumChip, isSelected && styles.albumChipActive]}
                onPress={() => setSelectedAlbumId(item.id)}
                onLongPress={() => {
                  if (item.id !== null) {
                    handleLongPressAlbum(item.id, item.name);
                  }
                }}
              >
                <Text style={[styles.albumChipText, isSelected && styles.albumChipTextActive]}>
                  📁 {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addAlbumChip}
              onPress={() => setIsModalOpen(true)}
            >
              <Text style={styles.addAlbumChipText}>+ Nuevo Álbum</Text>
            </TouchableOpacity>
          }
        />

        {/* Toggle Favoritas */}
        <View style={styles.favFilterRow}>
          <TouchableOpacity
            style={[styles.favToggle, onlyFavorites && styles.favToggleActive]}
            onPress={() => setOnlyFavorites((prev) => !prev)}
          >
            <Text style={[styles.favToggleText, onlyFavorites && styles.favToggleTextActive]}>
              {onlyFavorites ? '⭐ Solo Favoritas (Activo)' : '☆ Filtrar por Favoritas'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid de Fotos */}
      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No hay fotos</Text>
            <Text style={styles.emptyText}>
              {search || selectedAlbumId !== null || onlyFavorites
                ? 'Ninguna foto coincide con los filtros aplicados.'
                : 'Aún no tienes fotos guardadas. ¡Captura fotos en GeoCam!'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.photoCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/foto/[id]',
                params: { id: String(item.id) },
              })
            }
          >
            <Image source={{ uri: item.uri }} style={styles.photoImage} />

            {/* Badges superiores */}
            <View style={styles.cardBadgesTop}>
              {item.favorite ? (
                <View style={styles.favBadge}>
                  <Text style={styles.favBadgeText}>⭐</Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.sourceBadge,
                  item.source === 'gallery' ? styles.galleryBadge : styles.cameraBadge,
                ]}
              >
                <Text style={styles.sourceBadgeText}>
                  {item.source === 'gallery' ? '🖼️' : '📷'}
                </Text>
              </View>
            </View>

            {/* Información inferior de la tarjeta */}
            <View style={styles.photoInfo}>
              {item.albumName ? (
                <Text style={styles.albumTag} numberOfLines={1}>
                  📁 {item.albumName}
                </Text>
              ) : null}

              {item.note ? (
                <Text style={styles.photoNote} numberOfLines={2}>
                  📝 {item.note}
                </Text>
              ) : (
                <Text style={styles.photoNoteEmpty} numberOfLines={1}>
                  Sin nota agregada
                </Text>
              )}

              <View style={styles.photoMetaRow}>
                <Text style={styles.photoDate}>
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.photoGpsTag}>
                  {item.latitude !== null ? '📍 GPS' : '⚠️ Sin GPS'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal Crear Álbum */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Nuevo Álbum</Text>
            <Text style={styles.modalDesc}>
              Organiza tus fotos en álbumes temáticos locales.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del álbum (ej: Vacaciones)"
              placeholderTextColor="#737373"
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setNewAlbumName('');
                  setIsModalOpen(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateAlbum}
              >
                <Text style={styles.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 54,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: '#a3a3a3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filtersWrapper: {
    marginBottom: 12,
  },
  albumsList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  albumChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 8,
  },
  albumChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  albumChipText: {
    color: '#d4d4d4',
    fontSize: 13,
    fontWeight: '600',
  },
  albumChipTextActive: {
    color: '#052e16',
    fontWeight: '700',
  },
  addAlbumChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#525252',
    backgroundColor: 'transparent',
  },
  addAlbumChipText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  favFilterRow: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  favToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    alignSelf: 'flex-start',
  },
  favToggleActive: {
    backgroundColor: '#854d0e',
    borderColor: '#eab308',
  },
  favToggleText: {
    color: '#a3a3a3',
    fontSize: 12,
    fontWeight: '600',
  },
  favToggleTextActive: {
    color: '#fef08a',
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#141414',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  photoImage: {
    width: '100%',
    height: COLUMN_WIDTH,
    backgroundColor: '#262626',
  },
  cardBadgesTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  favBadgeText: {
    fontSize: 12,
  },
  sourceBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  galleryBadge: {
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  cameraBadge: {
    borderColor: '#10b981',
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 11,
  },
  photoInfo: {
    padding: 10,
  },
  albumTag: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  photoNote: {
    color: '#f5f5f5',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 6,
  },
  photoNoteEmpty: {
    color: '#737373',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  photoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 6,
  },
  photoDate: {
    color: '#737373',
    fontSize: 10,
  },
  photoGpsTag: {
    color: '#a3a3a3',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#a1a1aa',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: '#052e16',
    fontWeight: '700',
  },
});
