import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import type { Coords, PermissionState } from '@/types/geo';

interface Options {
  watch?: boolean;
}

interface GeoLocationState {
  permission: PermissionState;
  coords: Coords | null;
  error: string | null;
}

function mapPermission(res: Location.LocationPermissionResponse): PermissionState {
  if (res.granted) return 'granted';
  if (!res.canAskAgain) return 'blocked';
  if (res.status === 'undetermined') return 'undetermined';
  return 'denied';
}

function toCoords(loc: Location.LocationObject): Coords {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    timestamp: loc.timestamp,
  };
}

export function useGeoLocation({ watch = false }: Options = {}) {
  const [state, setState] = useState<GeoLocationState>({
    permission: 'checking',
    coords: null,
    error: null,
  });

  // 1. Al montar: solo CONSULTAR el permiso
  useEffect(() => {
    let cancelled = false;
    Location.getForegroundPermissionsAsync()
      .then((res) => {
        if (cancelled) return;
        const permission = mapPermission(res);
        setState((s) => ({ ...s, permission }));

        // En Android, si ya tiene permiso, obtener inmediatamente la última ubicación conocida
        if (permission === 'granted') {
          Location.getLastKnownPositionAsync()
            .then((loc) => {
              if (!cancelled && loc) {
                setState((s) => ({ ...s, coords: toCoords(loc), error: null }));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, permission: 'denied' }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 3. Lectura de ubicación optimizada para Android y iOS
  const getCurrent = useCallback(async (): Promise<Coords | null> => {
    try {
      // Primero intentar última posición conocida (instantánea en Android)
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 30000,
      });
      if (lastKnown) {
        const coords = toCoords(lastKnown);
        setState((s) => ({ ...s, coords, error: null }));
        // En paralelo refrescar la posición precisa
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
          .then((loc) => {
            setState((s) => ({ ...s, coords: toCoords(loc), error: null }));
          })
          .catch(() => {});
        return coords;
      }

      // Si no hay lastKnown reciente, solicitar GPS
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = toCoords(loc);
      setState((s) => ({ ...s, coords, error: null }));
      return coords;
    } catch (e) {
      // Fallback a cualquier posición en caché
      try {
        const cached = await Location.getLastKnownPositionAsync();
        if (cached) {
          const coords = toCoords(cached);
          setState((s) => ({ ...s, coords, error: null }));
          return coords;
        }
      } catch {}

      const message = e instanceof Error ? e.message : 'No se pudo obtener la ubicación';
      setState((s) => ({ ...s, error: message }));
      return null;
    }
  }, []);

  // 2. Solicitar permiso por acción explícita del usuario
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      const permission = mapPermission(res);
      setState((s) => ({ ...s, permission }));
      if (res.granted) {
        getCurrent();
      }
      return res.granted;
    } catch (e) {
      setState((s) => ({ ...s, permission: 'denied' }));
      return false;
    }
  }, [getCurrent]);

  // 4. Seguimiento continuo con distancia 0 para actualizaciones inmediatas en interiores
  useEffect(() => {
    if (!watch || state.permission !== 'granted') return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000,
        distanceInterval: 0, // 0 para responder inmediatamente en Android
      },
      (loc) => {
        if (!cancelled) {
          setState((s) => ({ ...s, coords: toCoords(loc), error: null }));
        }
      }
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else subscription = sub;
      })
      .catch((e) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            error: e instanceof Error ? e.message : 'Error de GPS',
          }));
        }
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [watch, state.permission]);

  const openSettings = useCallback(() => Linking.openSettings(), []);

  return { ...state, requestPermission, getCurrent, openSettings };
}
