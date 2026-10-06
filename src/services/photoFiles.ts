import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

const getPhotosDirectory = () => {
  if (Platform.OS === 'web') return null;
  return new Directory(Paths.document, 'photos');
};

export function persistPhoto(cacheUri: string): string {
  if (Platform.OS === 'web' || !cacheUri) {
    return cacheUri;
  }
  try {
    const photosDir = getPhotosDirectory();
    if (!photosDir) return cacheUri;

    if (!photosDir.exists) {
      photosDir.create();
    }

    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const destination = new File(photosDir, `photo_${uniqueSuffix}.jpg`);
    const source = new File(cacheUri);
    source.copy(destination);
    return destination.uri;
  } catch (error) {
    console.warn('Error al persistir la foto en el sistema de archivos:', error);
    return cacheUri;
  }
}

export function deletePhotoFile(uri: string) {
  if (Platform.OS === 'web' || !uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Error al eliminar archivo de foto:', error);
  }
}
