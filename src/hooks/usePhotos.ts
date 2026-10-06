import { useCallback } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { photosRepo, type PhotoFilters, type PhotoInput } from '@/db/repositories/photos';
import { persistPhoto } from '@/services/photoFiles';
import type { Coords } from '@/types/geo';

export interface AddPhotoInput {
  uri: string;
  coords: Coords | null;
  source: 'camera' | 'gallery';
  note?: string;
  albumId?: number | null;
}

export function usePhotos() {
  const { data: photos, error: photosError } = useLiveQuery(photosRepo.listQuery());
  const { data: photosWithLocation, error: locationError } = useLiveQuery(
    photosRepo.withLocationQuery()
  );

  const addPhoto = useCallback(async (input: AddPhotoInput) => {
    // C5: Guardar archivo permanentemente en la carpeta de documentos de la app
    const permanentUri = persistPhoto(input.uri);

    // T4: Convertir coords a columnas planas
    const photoData: PhotoInput = {
      uri: permanentUri,
      latitude: input.coords?.latitude ?? null,
      longitude: input.coords?.longitude ?? null,
      accuracy: input.coords?.accuracy ?? null,
      source: input.source,
      note: input.note?.trim() || null,
      albumId: input.albumId ?? null,
      favorite: false,
    };

    return photosRepo.create(photoData);
  }, []);

  const removePhoto = useCallback(async (id: number) => {
    return photosRepo.remove(id);
  }, []);

  const clearAll = useCallback(async () => {
    return photosRepo.clearAll();
  }, []);

  const updatePhoto = useCallback(async (id: number, data: Partial<PhotoInput>) => {
    return photosRepo.update(id, data);
  }, []);

  return {
    photos: photos ?? [],
    photosWithLocation: photosWithLocation ?? [],
    addPhoto,
    removePhoto,
    clearAll,
    updatePhoto,
    error: photosError || locationError,
  };
}

export function useFilteredPhotos(filters?: PhotoFilters) {
  const search = filters?.search ?? '';
  const albumId = filters?.albumId ?? null;
  const onlyFavorites = Boolean(filters?.onlyFavorites);

  // C4: useLiveQuery con dependencias para recalcular al cambiar los filtros
  const { data, error } = useLiveQuery(
    photosRepo.filteredQuery(filters),
    [search, albumId, onlyFavorites]
  );

  return {
    photos: data ?? [],
    error,
  };
}
