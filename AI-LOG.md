# Registro de Auditoría de IA (AI-LOG)

**Estudiante(s):** Nolger
**Semana:** 6
**Proyecto:** GeoCam – Taller Integrador 2

## 1. Prompts Utilizados
- "Escribe un Custom Hook en React Native con TypeScript que detecte cuando el usuario agita el teléfono usando expo-sensors, con umbral configurable y manejo de ciclo de vida seguro."
- "Implementa la pantalla GeoCam con CameraView de expo-camera, permisos contextuados y coordenadas GPS de expo-location."
- "Crea la pestaña de Mapa con react-native-maps para visualizar las fotos tomadas con coordenadas y separar visualmente las fotos sin ubicación."
- "Crea un contexto global en React Native (GeoPhotosContext) para administrar las fotos de manera inmutable con addPhoto, removePhoto y clearAll."
- "Corrige la captura y persistencia de fotos en Android y asegura que el mapa se enfoque correctamente en las coordenadas tomadas."
- "Agrega un botón en cada foto para abrir la ubicación directamente en Google Maps con un pin y muestra un carrusel interactivo de fotos con GPS en la pestaña de mapa."

## 2. Código Generado vs. Código Modificado
- **¿Qué generó la IA?:** Un hook `useShake` que se suscribía a `Accelerometer` dentro de `useEffect`, sin `setUpdateInterval(100)` y disparando el callback decenas de veces por cada agitado sin cooldown ni verificación de disponibilidad del hardware.
- **¿Qué modifiqué/corregí?:** Agregué `Accelerometer.isAvailableAsync()`, `Accelerometer.setUpdateInterval(100)`, un umbral configurable sobre la magnitud euclidiana del vector aceleración $\sqrt{x^2 + y^2 + z^2}$, un cooldown de 1000 ms y guardé el callback `onShake` en una `useRef` para evitar reiniciar la suscripción en cada render. Implementé la bandera `cancelled` para evitar condiciones de carrera si el componente se desmonta antes de resolver promesas asíncronas.
- **¿Qué generó la IA?:** Un `useGeoLocation` con llamada a `watchPositionAsync` sin control de resolución asíncrona ni limpieza segura ante desmontaje temprano, con `distanceInterval: 10` que impedía recibir coordenadas al probar en interiores.
- **¿Qué modifiqué/corregí?:** Añadí la bandera `cancelled` y llamada a `subscription?.remove()`. Se agregó `Location.getLastKnownPositionAsync()` para obtener coordenadas instantáneas en Android sin depender del tiempo de espera de satélites GPS, y se configuró `distanceInterval: 0` en `watchPositionAsync`.
- **¿Qué generó la IA?:** Bloqueo estricto `if (!isReady) return null` en `useCamera.ts` y falta de persistencia en disco de las fotos.
- **¿Qué modifiqué/corregí?:** En Android, el evento `onCameraReady` de `CameraView` puede dispararse antes de montar los listeners o retrasarse, provocando que `takePhoto()` retorne silenciosamente `null` y la foto nunca se guarde. Se flexibilizó la guarda comprobando `cameraRef.current`, se agregó manejo de excepciones y se implementó persistencia en `GeoPhotosContext` con `@react-native-async-storage/async-storage` para evitar que las fotos se pierdan si Android recicla la actividad al liberar memoria.
- **¿Qué generó la IA?:** Renderizado de fotos con coordenadas limitado únicamente a marcadores en `MapView` y pantalla negra en Android por falta de capas de respaldo y `loadingBackgroundColor` bloqueante.
- **¿Qué modifiqué/corregí?:** Se retiró `loadingBackgroundColor`, se integró `UrlTile` con OpenStreetMap como capa de respaldo, se agregó un carrusel horizontal interactivo de "Fotos Geolocalizadas" visible en todo momento y se añadió el botón `"Ver Pin en Google Maps"` mediante la utilidad `openInGoogleMaps` (`geo:` en Android y URL universal web).

## 3. Alucinaciones o Errores Detectados
- **Alucinación 1 - API antigua de Cámara:** Modelos entrenados con versiones previas de Expo frecuentemente sugieren `import { Camera } from 'expo-camera'` y llamar a `Camera.requestCameraPermissionsAsync()`. En Expo moderno (SDK 51+) esto fue reemplazado por el componente `CameraView` y el hook `useCameraPermissions()`.
- **Alucinación 2 - Opciones obsoletas de expo-image-picker:** La IA sugirió `mediaTypes: ImagePicker.MediaTypeOptions.Images`. En el SDK actual de Expo, esa constante está obsoleta y debe usarse el array de tipos `mediaTypes: ['images']`.
- **Alucinación 3 - Paquete retirado expo-permissions:** La IA suele sugerir `import * as Permissions from 'expo-permissions'`. Este paquete fue retirado del ecosistema Expo; los permisos se solicitan individualmente a través de cada módulo específico (`Location.requestForegroundPermissionsAsync()`, `useCameraPermissions()`.
- **Alucinación 4 - Tipos inexistentes en expo-sensors:** Se intentó importar `type Subscription` directamente desde `expo-sensors`, lo cual genera error en TypeScript porque la librería expone la suscripción con la interfaz `{ remove: () => void }`.
- **Alucinación 5 - Incompatibilidad Web de react-native-maps:** Importar `react-native-maps` en un archivo universal genera una falla inmediata en Web (`codegenNativeComponent is not a function`) porque es una función de Fabric inexistente en `react-native-web`. Se solucionó dividiendo componentes por plataforma (`.native.tsx` y `.tsx`).
- **Alucinación 6 - Suposición de que initialRegion es reactivo:** Los modelos asumen que cambiar el prop `initialRegion` reposiciona el mapa. En Android y iOS, `initialRegion` se ignora tras el primer render; para mover la vista del mapa tras capturar coordenadas es obligatorio usar los métodos imperativos de la referencia nativa (`mapRef.current.animateToRegion` o `fitToCoordinates`).
- **Alucinación 7 - Ocultar fotos geolocalizadas si el mapa nativo no responde:** Asumir que las fotos con GPS solo deben representarse como pines nativos provoca que en dispositivos sin Google Play Services o sin clave API queden completamente invisibles. La solución correcta es complementar el mapa con un carrusel interactivo persistente de miniaturas y enlaces nativos a Google Maps.
