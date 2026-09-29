import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

type Subscription = { remove: () => void };

interface ShakeOptions {
  threshold?: number;
  cooldownMs?: number;
}

export function useShake(
  onShake: () => void,
  options?: ShakeOptions
): { isAvailable: boolean | null } {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const onShakeRef = useRef(onShake);
  const lastShakeTimeRef = useRef<number>(0);

  // Keep latest callback in ref to prevent restarting subscriptions on every render
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const threshold = options?.threshold ?? 2.0;
  const cooldownMs = options?.cooldownMs ?? 1000;

  useEffect(() => {
    let cancelled = false;
    let subscription: Subscription | null = null;

    Accelerometer.isAvailableAsync()
      .then((avail) => {
        if (cancelled) return;
        setIsAvailable(avail);

        if (avail) {
          Accelerometer.setUpdateInterval(100);
          const sub = Accelerometer.addListener(({ x, y, z }) => {
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            const now = Date.now();

            if (magnitude > threshold && now - lastShakeTimeRef.current > cooldownMs) {
              lastShakeTimeRef.current = now;
              onShakeRef.current();
            }
          });

          if (cancelled) {
            sub.remove();
          } else {
            subscription = sub;
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAvailable(false);
        }
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [threshold, cooldownMs]);

  return { isAvailable };
}
