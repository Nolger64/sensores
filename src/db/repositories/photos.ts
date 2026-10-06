import { and, desc, eq, isNotNull, like } from 'drizzle-orm';
import { db } from '@/db/client';
import { albums, photos, type NewPhoto } from '@/db/schema';
import { deletePhotoFile } from '@/services/photoFiles';

export type PhotoInput = Omit<NewPhoto, 'id'>;

export interface PhotoFilters {
  search?: string;
  albumId?: number | null;
  onlyFavorites?: boolean;
}

export const photosRepo = {
  listQuery() {
    return db
      .select({
        id: photos.id,
        uri: photos.uri,
        latitude: photos.latitude,
        longitude: photos.longitude,
        accuracy: photos.accuracy,
        source: photos.source,
        albumId: photos.albumId,
        albumName: albums.name,
        note: photos.note,
        favorite: photos.favorite,
        createdAt: photos.createdAt,
      })
      .from(photos)
      .leftJoin(albums, eq(photos.albumId, albums.id))
      .orderBy(desc(photos.createdAt));
  },

  withLocationQuery() {
    return db
      .select({
        id: photos.id,
        uri: photos.uri,
        latitude: photos.latitude,
        longitude: photos.longitude,
        accuracy: photos.accuracy,
        source: photos.source,
        albumId: photos.albumId,
        albumName: albums.name,
        note: photos.note,
        favorite: photos.favorite,
        createdAt: photos.createdAt,
      })
      .from(photos)
      .leftJoin(albums, eq(photos.albumId, albums.id))
      .where(isNotNull(photos.latitude))
      .orderBy(desc(photos.createdAt));
  },

  filteredQuery(filters?: PhotoFilters) {
    const conditions = [];

    if (filters?.search && filters.search.trim().length > 0) {
      conditions.push(like(photos.note, `%${filters.search.trim()}%`));
    }

    if (filters?.albumId !== undefined && filters.albumId !== null) {
      conditions.push(eq(photos.albumId, filters.albumId));
    }

    if (filters?.onlyFavorites) {
      conditions.push(eq(photos.favorite, true));
    }

    const baseQuery = db
      .select({
        id: photos.id,
        uri: photos.uri,
        latitude: photos.latitude,
        longitude: photos.longitude,
        accuracy: photos.accuracy,
        source: photos.source,
        albumId: photos.albumId,
        albumName: albums.name,
        note: photos.note,
        favorite: photos.favorite,
        createdAt: photos.createdAt,
      })
      .from(photos)
      .leftJoin(albums, eq(photos.albumId, albums.id));

    if (conditions.length > 0) {
      return baseQuery.where(and(...conditions)).orderBy(desc(photos.createdAt));
    }

    return baseQuery.orderBy(desc(photos.createdAt));
  },

  async findById(id: number) {
    return db
      .select({
        id: photos.id,
        uri: photos.uri,
        latitude: photos.latitude,
        longitude: photos.longitude,
        accuracy: photos.accuracy,
        source: photos.source,
        albumId: photos.albumId,
        albumName: albums.name,
        note: photos.note,
        favorite: photos.favorite,
        createdAt: photos.createdAt,
      })
      .from(photos)
      .leftJoin(albums, eq(photos.albumId, albums.id))
      .where(eq(photos.id, id))
      .get();
  },

  async create(data: PhotoInput) {
    return db.insert(photos).values(data);
  },

  async update(id: number, data: Partial<PhotoInput>) {
    return db.update(photos).set(data).where(eq(photos.id, id));
  },

  async remove(id: number) {
    const item = await db.select().from(photos).where(eq(photos.id, id)).get();
    if (item?.uri) {
      deletePhotoFile(item.uri);
    }
    return db.delete(photos).where(eq(photos.id, id));
  },

  async clearAll() {
    const all = await db.select({ uri: photos.uri }).from(photos);
    for (const item of all) {
      if (item.uri) {
        deletePhotoFile(item.uri);
      }
    }
    return db.delete(photos);
  },
};
