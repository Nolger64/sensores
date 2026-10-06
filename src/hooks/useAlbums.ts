import { useCallback, useEffect } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { albumsRepo } from '@/db/repositories/albums';

export function useAlbums() {
  const { data: albums, error } = useLiveQuery(albumsRepo.listQuery());

  useEffect(() => {
    // Inicializar álbumes sugeridos por defecto
    albumsRepo.seedDefaultAlbums().catch(console.warn);
  }, []);

  const createAlbum = useCallback(async (name: string) => {
    return albumsRepo.create(name);
  }, []);

  const removeAlbum = useCallback(async (id: number) => {
    return albumsRepo.remove(id);
  }, []);

  return {
    albums: albums ?? [],
    createAlbum,
    removeAlbum,
    error,
  };
}
