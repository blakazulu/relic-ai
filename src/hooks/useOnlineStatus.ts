import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';

export interface UseOnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnline: Date | null;
}

/**
 * Hook to monitor online/offline status
 * Updates the Zustand store and tracks connection changes
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const setOnlineStatus = useAppStore((s) => s.setOnlineStatus);
  const storeIsOnline = useAppStore((s) => s.isOnline);

  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(
    typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null
  );

  const handleOnline = useCallback(() => {
    const now = new Date();
    setOnlineStatus(true);
    setLastOnline(now);

    // If we were offline, mark that we just came back online
    if (!storeIsOnline) {
      setWasOffline(true);
      // Clear the flag after 5 seconds
      setTimeout(() => setWasOffline(false), 5000);
    }
  }, [setOnlineStatus, storeIsOnline]);

  const handleOffline = useCallback(() => {
    setOnlineStatus(false);
  }, [setOnlineStatus]);

  useEffect(() => {
    // Initialize with current status
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setOnlineStatus(isOnline);

    if (isOnline) {
      setLastOnline(new Date());
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, setOnlineStatus]);

  return {
    isOnline: storeIsOnline,
    wasOffline,
    lastOnline,
  };
}
