import { Linking, Platform } from 'react-native';

/**
 * Abre Google Maps con un pin en las coordenadas especificadas.
 * Compatible con Android (Google Maps app nativa), iOS y Web.
 */
export async function openInGoogleMaps(
  latitude: number,
  longitude: number,
  label = 'Foto GeoCam'
): Promise<void> {
  const latLng = `${latitude},${longitude}`;
  const androidGeoUrl = `geo:0,0?q=${latLng}(${encodeURIComponent(label)})`;
  const universalUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;

  try {
    if (Platform.OS === 'android') {
      const canOpen = await Linking.canOpenURL(androidGeoUrl);
      if (canOpen) {
        await Linking.openURL(androidGeoUrl);
        return;
      }
    }
    await Linking.openURL(universalUrl);
  } catch (error) {
    console.warn('Error opening Google Maps:', error);
    try {
      await Linking.openURL(universalUrl);
    } catch (e) {
      console.error('Failed to open web maps URL:', e);
    }
  }
}
