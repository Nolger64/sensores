# Registro de Auditoría de IA (AI-LOG) – Semana 7

**Estudiante(s):** Nolger Rodríguez  
**Semana:** 7  
**Proyecto:** GeoCam persistente – Base de Datos Local Offline-First con Drizzle ORM y SQLite  

---

## 1. Prompts Utilizados

1. *"Configura expo-sqlite con Drizzle ORM en un proyecto Expo SDK 57 con Expo Router, habilitando soporte para migraciones con drizzle-kit, babel-plugin-inline-import y metro.config.js."*
2. *"Modela el esquema relacional en Drizzle ORM con TypeScript para fotos geolocalizadas (photos) y álbumes (albums), asegurando clave foránea albumId opcional con onDelete: 'set null', columnas note y favorite, e índice en created_at."*
3. *"Genera las migraciones versionadas con drizzle-kit generate y configura el migrador useMigrations protegiendo el layout raíz de Expo Router."*
4. *"Crea la capa de repositorios (photosRepo y albumsRepo) desacoplada de la UI, con consultas reactivas listQuery, withLocationQuery (usando isNotNull) y filteredQuery con soporte para like."*
5. *"Implementa el hook usePhotos con useLiveQuery para reaccionar en tiempo real a inserciones, actualizaciones y borrados, transformando coords a columnas planas."*
6. *"Diseña el servicio photoFiles.ts utilizando la nueva API orientada a objetos de expo-file-system (clases File, Directory y Paths) para persistir fotos desde la caché a la carpeta de documentos permanentes y borrarlas sincronizadamente."*
7. *"Construye la pantalla de detalle/edición CRUD app/foto/[id].tsx y la pantalla de galería app/(tabs)/galeria.tsx con búsqueda reactiva por nota, filtros por álbum y favoritas."*
8. *"Crea un script de benchmark (scripts/benchmark-seed.ts) que inserte 1.000 fotos y mida con console.time el impacto del índice photos_created_at_idx."*

---

## 2. Código Generado vs. Código Modificado

### 2.1. Cliente SQLite y cumplimiento de Llaves Foráneas (PRAGMA)
- **¿Qué generó la IA?:** Generó la conexión con `openDatabaseSync('geocam.db')` sin habilitar `enableChangeListener: true` y sin activar `PRAGMA foreign_keys = ON`.
- **¿Qué modifiqué/corregí?:** SQLite desactiva por defecto la verificación de llaves foráneas en cada nueva conexión. Si no se ejecuta `expoDb.execSync('PRAGMA foreign_keys = ON;')`, la regla `onDelete: 'set null'` es ignorada silenciosamente y permite inconsistencias relacionales. Asimismo, se agregó `enableChangeListener: true` en las opciones de `openDatabaseSync`, indispensable para que `useLiveQuery` escuche eventos de mutación y re-renderice automáticamente la UI.

### 2.2. Esquema Drizzle y Regla ON DELETE en Álbumes
- **¿Qué generó la IA?:** Generó la tabla `photos` con `albumId` vinculado mediante `references(() => albums.id, { onDelete: 'cascade' })`.
- **¿Qué modifiqué/corregí?:** En los requerimientos del taller (C1) se especifica explícitamente que al eliminar un álbum, las fotos pertenecientes a ese álbum **no deben eliminarse**, sino quedar sin álbum asignado (`null`). Se corrigió a `onDelete: 'set null'` y se marcó `albumId` como anulable (`integer('album_id')`).

### 2.3. Persistencia de Archivos con Expo FileSystem (SDK 57)
- **¿Qué generó la IA?:** Sugirió llamadas a la API obsoleta `FileSystem.copyAsync({ from: cacheUri, to: destUri })` combinada con constantes de `FileSystem.documentDirectory`.
- **¿Qué modifiqué/corregí?:** En Expo SDK 57, la API recomendada y moderna es orientada a objetos: `import { Directory, File, Paths } from 'expo-file-system'`. Se estructuró el servicio `photoFiles.ts` instanciando `new Directory(Paths.document, 'photos')`, verificando `photosDir.exists` y copiando mediante `source.copy(destination)`. Al eliminar un registro en SQLite, se invoca `deletePhotoFile(uri)` que ejecuta `file.delete()` si existe.

### 2.4. Filtros reactivos con dependencias en `useLiveQuery`
- **¿Qué generó la IA?:** En la pantalla de galería, intentaba filtrar el arreglo de fotos en memoria con un `useMemo(() => photos.filter(...), [photos, search])`.
- **¿Qué modifiqué/corregí?:** El requerimiento C4 exige que el filtrado se resuelva a nivel de base de datos SQL con `like(photos.note, ...)` y que `useLiveQuery` se recalcule pasando el array de dependencias: `useLiveQuery(photosRepo.filteredQuery(filters), [search, albumId, onlyFavorites])`. De esta manera, SQLite aplica los filtros directamente en la consulta.

### 2.5. Desacoplamiento de Pantallas y Ciclo de Vida
- **¿Qué generó la IA?:** Intentaba importar métodos de Drizzle (`db.select()`, `eq()`) directamente dentro de los componentes `galeria.tsx` y `foto/[id].tsx`.
- **¿Qué modifiqué/corregí?:** Siguiendo las reglas estrictas de arquitectura por capas, las pantallas únicamente interactúan con custom hooks (`usePhotos`, `useAlbums`, `useFilteredPhotos`) y los repositorios (`photosRepo`, `albumsRepo`). Ninguna pantalla contiene lógica SQL o dependencias directas de Drizzle.

---

## 3. Alucinaciones y Errores de IA Detectados

| Caso / Error de IA | Problema Detectado | Corrección Aplicada |
| :--- | :--- | :--- |
| **`SQLite.openDatabase(...)` o `db.transaction(...)`** | API legada de `expo-sqlite` retirada en versiones recientes. Genera error de método no definido en tiempo de ejecución. | Se utilizó la API sincrónica actual: `openDatabaseSync('geocam.db', { enableChangeListener: true })`. |
| **`import { drizzle } from 'drizzle-orm/better-sqlite3'`** | Driver diseñado para entornos Node.js con binarios nativos C++, incompatible con React Native / Expo Go. | Se importó el driver oficial para móviles: `drizzle-orm/expo-sqlite`. |
| **`drizzle.config.ts` sin `driver: 'expo'`** | `drizzle-kit` no genera el archivo índice `drizzle/migrations.js` necesario para empaquetar migraciones en Expo. | Se configuró explícitamente `dialect: 'sqlite'` y `driver: 'expo'`. |
| **Falta de `babel-plugin-inline-import` o extensión `sql` en Metro** | Metro bundler falla con error sintáctico al intentar empaquetar los archivos `.sql` generados por Drizzle. | Se configuró `babel.config.js` con el plugin `inline-import` (`extensions: ['.sql']`) y `metro.config.js` agregando `config.resolver.sourceExts.push('sql')`. |
| **Uso de `npx drizzle-kit push`** | Diseñado para bases de datos de servidor con conexión TCP directa. En un dispositivo móvil no existe conexión directa accesible desde la máquina de desarrollo. | Se generaron migraciones estáticas con `npx drizzle-kit generate` y se ejecutaron en el dispositivo con `useMigrations`. |
| **Apertura de BD sin `enableChangeListener`** | Las consultas realizadas con `useLiveQuery` permanecen estáticas y no detectan cambios al insertar o borrar datos. | Se activó `{ enableChangeListener: true }` al abrir la base. |
| **Fotos sin borrado de archivos físicos** | Eliminar una fila en la base de datos deja los archivos de imagen huérfanos ocupando almacenamiento de forma indefinida. | Se sincronizó el borrado en `photosRepo.remove()` y `photosRepo.clearAll()` para invocar `deletePhotoFile(uri)`. |
| **Mezcla de APIs de `expo-file-system`** | Mezclar `FileSystem.copyAsync` con clases `File` causa incompatibilidades de tipos e importaciones no resueltas. | Se implementó el servicio exclusivamente con `Directory`, `File` y `Paths`. |

---

## 4. Verificación de Migraciones y Versionamiento

1. **Migración 1 (`0000_chunky_amazoness.sql`):** Creación de la tabla `photos` inicial (Requisitos T1 - T6).
2. **Migración 2 (`0001_skinny_shriek.sql`):** Creación de la tabla `albums` con índice único en `name`, adición de columnas `album_id`, `note` y `favorite` en `photos` con valor por defecto (Requisitos C1 - C2).
3. **Migración 3 (`0002_black_ultragirl.sql`):** Creación del índice `photos_created_at_idx` sobre `photos(created_at)` (Reto opcional).
4. Todas las migraciones fueron generadas mediante `npx drizzle-kit generate` sin modificación manual, y la carpeta `drizzle/` se encuentra completamente versionada en Git.
