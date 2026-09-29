import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeoPhoto } from '@/types/geo';

const STORAGE_KEY = '@geocam_photos_v1';

interface GeoPhotosContextType {
  photos: GeoPhoto[];
  addPhoto: (photo: GeoPhoto) => void;
  removePhoto: (id: string) => void;
  clearAll: () => void;
  isLoading: boolean;
}

const GeoPhotosContext = createContext<GeoPhotosContextType | undefined>(undefined);

export function GeoPhotosProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<GeoPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar fotos persistidas al montar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setPhotos(parsed);
            }
          } catch (e) {
            console.warn('Error parsing stored photos:', e);
          }
        }
      })
      .catch((e) => console.warn('Error reading photos from storage:', e))
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback((newPhotos: GeoPhoto[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos)).catch((e) =>
      console.warn('Error saving photos to storage:', e)
    );
  }, []);

  const addPhoto = useCallback((photo: GeoPhoto) => {
    setPhotos((prev) => {
      const next = [photo, ...prev];
      persist(next);
      return next;
    });
  }, [persist]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((item) => item.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearAll = useCallback(() => {
    setPhotos([]);
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      photos,
      addPhoto,
      removePhoto,
      clearAll,
      isLoading,
    }),
    [photos, addPhoto, removePhoto, clearAll, isLoading]
  );

  return (
    <GeoPhotosContext.Provider value={value}>
      {children}
    </GeoPhotosContext.Provider>
  );
}

export function useGeoPhotos(): GeoPhotosContextType {
  const context = useContext(GeoPhotosContext);
  if (!context) {
    throw new Error('useGeoPhotos must be used within a GeoPhotosProvider');
  }
  return context;
}
