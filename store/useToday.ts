import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayKey } from '@/domain/date';

/** Re-evaluates the local date at midnight and whenever the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    const refresh = () => {
      const next = todayKey();
      setToday((current) => (current === next ? current : next));
    };

    const interval = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
    const timeout = setTimeout(refresh, Math.max(1_000, midnight.getTime() - now.getTime()));

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      subscription.remove();
    };
  }, []);

  return today;
}
