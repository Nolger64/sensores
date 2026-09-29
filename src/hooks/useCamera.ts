import { useCallback, useRef, useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import type { PermissionState } from '@/types/geo';

export function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Safeguard: on Android, onCameraReady sometimes fires before the callback is registered
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cameraRef.current) {
        setIsReady(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const permissionState: PermissionState = !permission
    ? 'checking'
    : permission.granted
    ? 'granted'
    : !permission.canAskAgain
    ? 'blocked'
    : permission.status === 'undetermined'
    ? 'undetermined'
    : 'denied';

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return null;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        shutterSound: false,
      });
      return photo ?? null;
    } catch (e) {
      console.warn('Camera takePhoto exception on Android/iOS:', e);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    cameraRef,
    permissionState,
    requestPermission,
    openSettings: () => Linking.openSettings(),
    facing,
    toggleFacing,
    onCameraReady: () => setIsReady(true),
    takePhoto,
    isCapturing,
    isReady,
  };
}
