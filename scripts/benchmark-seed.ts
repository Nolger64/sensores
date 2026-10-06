/**
 * Script de benchmark para el Reto Opcional de la Semana 7.
 * Mide el rendimiento de inserción y consulta sobre 1.000 fotos con el índice photos_created_at_idx.
 */
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { desc, count } from 'drizzle-orm';
import * as schema from '../src/db/schema';

async function runBenchmark() {
  console.log('--- INICIANDO RETO OPCIONAL: BENCHMARK 1.000 FOTOS ---');
  
  const expoDb = openDatabaseSync('geocam.db');
  expoDb.execSync('PRAGMA foreign_keys = ON;');
  const db = drizzle(expoDb, { schema });

  // Contar fotos actuales
  const initialCount = await db.select({ value: count() }).from(schema.photos);
  console.log(`Fotos existentes en base de datos: ${initialCount[0].value}`);

  console.log('Insertando 1.000 fotos de prueba...');
  console.time('Tiempo de inserción (1.000 fotos)');

  const mockPhotos: schema.NewPhoto[] = [];
  const baseTime = Date.now();

  for (let i = 1; i <= 1000; i++) {
    mockPhotos.push({
      uri: `file:///data/user/0/host.exp.exponent/files/photos/benchmark_${i}.jpg`,
      latitude: 11.5 + (Math.random() - 0.5) * 0.1,
      longitude: -72.8 + (Math.random() - 0.5) * 0.1,
      accuracy: 5 + Math.random() * 10,
      source: i % 2 === 0 ? 'camera' : 'gallery',
      note: `Foto de prueba rendimiento #${i} para benchmark`,
      favorite: i % 5 === 0,
      createdAt: new Date(baseTime - i * 60000),
    });
  }

  // Insertar en lotes de 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < mockPhotos.length; i += BATCH_SIZE) {
    const batch = mockPhotos.slice(i, i + BATCH_SIZE);
    await db.insert(schema.photos).values(batch);
  }

  console.timeEnd('Tiempo de inserción (1.000 fotos)');

  // Medir consulta ordenada por created_at aprovechando el índice creado en la migración 0002
  console.log('Consultando 1.000 fotos ordenadas por createdAt desc (usando índice photos_created_at_idx)...');
  console.time('Tiempo de consulta con índice');

  const results = await db
    .select({
      id: schema.photos.id,
      note: schema.photos.note,
      createdAt: schema.photos.createdAt,
    })
    .from(schema.photos)
    .orderBy(desc(schema.photos.createdAt))
    .limit(1000);

  console.timeEnd('Tiempo de consulta con índice');
  console.log(`Total de fotos recuperadas: ${results.length}`);
  console.log('--- BENCHMARK COMPLETADO EXITOSAMENTE ---');
}

export default runBenchmark;
