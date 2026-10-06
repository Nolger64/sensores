import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { albums } from '@/db/schema';

export const albumsRepo = {
  listQuery() {
    return db.select().from(albums).orderBy(asc(albums.name));
  },

  async findById(id: number) {
    return db.select().from(albums).where(eq(albums.id, id)).get();
  },

  async create(name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('El nombre del álbum no puede estar vacío');
    return db.insert(albums).values({ name: trimmed });
  },

  async remove(id: number) {
    // Al eliminar un álbum, SQLite aplicará ON DELETE SET NULL a las fotos
    return db.delete(albums).where(eq(albums.id, id));
  },

  async seedDefaultAlbums() {
    const existing = await db.select().from(albums).limit(1);
    if (existing.length === 0) {
      await db.insert(albums).values([
        { name: 'Favoritas' },
        { name: 'Paisajes' },
        { name: 'Trabajo' },
      ]).onConflictDoNothing();
    }
  },
};
