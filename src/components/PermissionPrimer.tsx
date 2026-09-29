import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import type { PermissionState } from '@/types/geo';

interface Props {
  title: string;
  description: string;
  state: PermissionState;
  onRequest: () => void;
  onOpenSettings: () => void;
}

export function PermissionPrimer({
  title,
  description,
  state,
  onRequest,
  onOpenSettings,
}: Props) {
  const isBlocked = state === 'blocked';

  return (
    <View style={styles.container}>
      {/* Icon with subtle halo */}
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{isBlocked ? '⚙️' : '📷'}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.card}>
        <Text style={styles.description}>
          {isBlocked
            ? 'Has deshabilitado este permiso previamente en el sistema. Para continuar tomando fotos geolocalizadas, debes habilitarlo desde los Ajustes del dispositivo.'
            : description}
        </Text>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyNoteIcon}>🔒</Text>
          <Text style={styles.privacyNoteText}>
            Tus fotos y datos de ubicación se almacenan únicamente en tu dispositivo y nunca se comparten con terceros.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={isBlocked ? onOpenSettings : onRequest}
        style={({ pressed }) => [
          styles.button,
          isBlocked ? styles.buttonBlocked : styles.buttonPrimary,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, isBlocked && styles.buttonTextBlocked]}>
          {isBlocked ? 'Abrir Ajustes del Sistema' : 'Permitir Acceso a la Cámara'}
        </Text>
      </Pressable>

      {isBlocked && (
        <Text style={styles.hintText}>
          Toca el botón para ir directo a la sección de permisos de la aplicación.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    fontSize: 38,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 24,
    width: '100%',
    gap: 14,
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#d4d4d4',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  privacyNoteIcon: {
    fontSize: 14,
  },
  privacyNoteText: {
    color: '#a1a1aa',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  button: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
  },
  buttonBlocked: {
    backgroundColor: '#3b82f6',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontWeight: '700',
    color: '#0a0a0a',
    fontSize: 16,
  },
  buttonTextBlocked: {
    color: '#ffffff',
  },
  hintText: {
    textAlign: 'center',
    color: '#71717a',
    fontSize: 12,
    marginTop: 14,
    maxWidth: 280,
  },
});
