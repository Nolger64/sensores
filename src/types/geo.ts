// types/geo.ts
export type PermissionState =
  | 'checking'
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'blocked';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp?: number;
}

export interface GeoPhoto {
  id: string | number;
  uri: string;
  coords: Coords | null;
  source: 'camera' | 'gallery';
  createdAt: number | Date;
  albumId?: number | null;
  albumName?: string | null;
  note?: string | null;
  favorite?: boolean;
}

export interface DbPhoto {
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
