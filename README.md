# GeoCam – Módulos Nativos y Sensores del Dispositivo

Aplicación móvil desarrollada con **Expo** y **React Native** para capturar fotos geolocalizadas, reaccionar a sensores físicos del dispositivo (acelerómetro para gesto de sacudida/shake) y explorar las capturas en un mapa interactivo con degradación elegante de permisos.

---

## 📱 Características Principales

- **Manejo Contextual de Permisos (Cámara y GPS):**
  - Los permisos nunca se solicitan al iniciar la app, sino en contexto al momento de interactuar con la funcionalidad requerida.
  - Pantalla previa de explicación (`PermissionPrimer`) para maximizar la tasa de aceptación.
  - Manejo completo de los estados de permiso: `checking`, `undetermined`, `granted`, `denied`, `blocked`.
  - Redirección directa a los Ajustes del sistema mediante `Linking.openSettings()` cuando un permiso está bloqueado (`canAskAgain: false`).
- **Degradación Elegante:**
  - Si el usuario rechaza los permisos de GPS, la cámara continúa funcionando normalmente y las fotos se guardan con `coords: null`.
  - La interfaz notifica al usuario con un banner de advertencia para activar la ubicación sin bloquear la toma de fotos.
- **R1: Estado Global Inmutable de Fotos:**
  - `GeoPhotosContext` con `addPhoto`, `removePhoto` y `clearAll`.
  - Centralizado en el `_layout.tsx` de las pestañas para sincronización en tiempo real entre la cámara y el mapa.
- **R2: Importación desde Galería:**
  - Integración con `expo-image-picker` mediante `mediaTypes: ['images']`.
  - Diferenciación visual clara de origen entre fotos tomadas con la cámara (`source: 'camera'`) y fotos importadas (`source: 'gallery'`).
- **R3: Pestaña de Mapa:**
  - Visualización geográfica con `react-native-maps` centrada dinámicamente en la posición actual del usuario o en la última foto tomada.
  - Marcadores interactivos que muestran miniatura y detalles al pulsar (`Callout`).
  - Sección dedicada independiente para listar las fotos "Sin ubicación".
- **R4: Custom Hook `useShake`:**
  - Suscripción al acelerómetro de `expo-sensors` con verificación previa (`isAvailableAsync`), frecuencia de 100 ms y cálculo de magnitud euclidiana ($\sqrt{x^2 + y^2 + z^2}$).
  - Cooldown de enfriamiento para evitar disparos repetidos ante una sola sacudida.
  - Alerta nativa de confirmación para eliminar todas las fotos guardadas (`clearAll`).
- **R5: Auditoría de IA:**
  - Archivo `AI-LOG.md` en la raíz con el registro de prompts, correcciones y alucinaciones detectadas.

---

## 🔄 Máquina de Estados de Permisos

```
checking ───► undetermined ───► (usuario acepta) ───► granted
                  │
                  └───► (usuario rechaza) ───► denied ───► (rechaza de nuevo) ───► blocked
                                                                                     │
                                                                   Linking.openSettings()
                                                                                     │
                                                                                     ▼
                                                                     (activa en Ajustes) ───► granted
```

---

## 📸 Estados de Permisos (Capturas y Flujo)

| Estado | Comportamiento | UI / Acción |
| :--- | :--- | :--- |
| **Concedido (`granted`)** | Acceso total a cámara y visualización de coordenadas GPS en vivo (`±precisión m`). | Vista de cámara activa + controles inferiores + coordenadas en pantalla. |
| **Rechazado (`denied`)** | Cámara degradada sin GPS. Muestra banner informativo para permitir acceso. | Banner superior: *"Activa la ubicación para etiquetar tus fotos"*. |
| **Bloqueado (`blocked`)** | El usuario rechazó de forma permanente (`canAskAgain: false`). | `PermissionPrimer` muestra botón **"Abrir Ajustes"** para ir a la configuración del sistema. |

### Diagrama Visual de Estados de Permiso

```
+-----------------------------------------------------------+
|                   ESTADOS DE PERMISOS                     |
+-----------------------------+-----------------------------+
| 1. CONCEDIDO (granted)      | Cámara activa, overlay GPS  |
| 2. RECHAZADO (denied)       | Cámara activa + banner GPS  |
| 3. BLOQUEADO (blocked)      | Botón "Abrir Ajustes"       |
+-----------------------------+-----------------------------+
```

> *(Para adjuntar capturas de pantalla o GIFs desde tu dispositivo físico, colócalos en la carpeta `assets/screenshots/` y enlázalos aquí).*

---

## 📂 Estructura del Proyecto

```
sensores/
├── AI-LOG.md                       # Registro de auditoría de IA (Semana 6)
├── README.md                       # Documentación completa del proyecto
├── app.json                        # Configuración y plugins nativos (cámara, ubicación, galería)
├── package.json                    # Dependencias compatibles con Expo SDK
├── tsconfig.json                   # Configuración de TypeScript con alias @/*
└── src/
    ├── app/
    │   ├── _layout.tsx             # Root layout con ThemeProvider y Stack
    │   ├── index.tsx               # Redirección inicial hacia /(tabs)/geocam
    │   └── (tabs)/
    │       ├── _layout.tsx         # Pestañas GeoCam y Mapa + GeoPhotosProvider + useShake global
    │       ├── geocam.tsx          # Pantalla principal con CameraView, GPS y selector de galería
    │       └── mapa.tsx            # Pantalla de mapa con marcadores y sección "Sin ubicación"
    ├── components/
    │   └── PermissionPrimer.tsx    # Pantalla explicativa previa de permisos
    ├── context/
    │   └── GeoPhotosContext.tsx    # Contexto global inmutable de fotos
    ├── hooks/
    │   ├── useCamera.ts            # Hook con CameraView ref, takePictureAsync y toggleFacing
    │   ├── useGeoLocation.ts       # Hook con permisos, getCurrentPosition y watchPosition
    │   └── useShake.ts             # Hook del acelerómetro para detección de agitación
    └── types/
        └── geo.ts                  # Interfaces Coords, GeoPhoto y PermissionState
```

---

## 🚀 Ejecución del Proyecto

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npx expo start
   ```

3. **Probar en dispositivo físico (Recomendado):**
   - Abre la app **Expo Go** en tu dispositivo físico (iOS o Android).
   - Escanea el código QR que muestra la terminal.
   - *Nota:* La cámara nativa y los sensores de aceleración requieren un dispositivo físico.

4. **Verificación de Tipos y Calidad:**
   ```bash
   npx tsc --noEmit
   ```

---

## 🧹 Limpieza Segura de Suscripciones

Tanto `useGeoLocation` como `useShake` implementan una bandera de control `let cancelled = false;` en el cleanup del `useEffect`:
- Si el usuario sale de la pantalla antes de que la promesa asíncrona de inicialización se resuelva, la suscripción se cancela de inmediato (`sub.remove()`) para evitar fugas de memoria o que el GPS/acelerómetro permanezcan activos en segundo plano.
