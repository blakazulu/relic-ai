import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getQueuedOperations,
  processQueue,
  clearQueue,
  type QueuedOperation,
  type ProcessQueueResult,
} from '@/lib/api/offlineQueue';
import { useAppStore } from '@/stores/appStore';

export interface UseOfflineQueueReturn {
  queuedOperations: QueuedOperation[];
  isProcessing: boolean;
  processQueuedOperations: () => Promise<ProcessQueueResult>;
  clearQueuedOperations: () => void;
  hasQueuedOperations: boolean;
  refreshQueue: () => void;
}

/**
 * Hook for managing the offline operations queue
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isOnline = useAppStore((s) => s.isOnline);
  const hasAutoProcessed = useRef(false);

  const refreshQueue = useCallback(() => {
    setQueuedOperations(getQueuedOperations());
  }, []);

  // Refresh queue on mount and when online status changes
  useEffect(() => {
    refreshQueue();
    // Reset auto-process flag when going offline
    if (!isOnline) {
      hasAutoProcessed.current = false;
    }
  }, [refreshQueue, isOnline]);

  const processQueuedOperations = useCallback(async (): Promise<ProcessQueueResult> => {
    if (isProcessing) {
      return { processed: 0, failed: 0, remaining: queuedOperations.length };
    }

    setIsProcessing(true);
    try {
      const result = await processQueue();
      setQueuedOperations(getQueuedOperations());
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, queuedOperations.length]);

  const clearQueuedOperations = useCallback(() => {
    clearQueue();
    setQueuedOperations([]);
  }, []);

  // Auto-process queue when coming back online (only once per reconnection)
  useEffect(() => {
    if (isOnline && queuedOperations.length > 0 && !isProcessing && !hasAutoProcessed.current) {
      hasAutoProcessed.current = true;
      processQueue().then((result) => {
        setQueuedOperations(getQueuedOperations());
        setIsProcessing(false);
      }).catch(() => {
        setIsProcessing(false);
      });
    }
  }, [isOnline, queuedOperations.length, isProcessing]);

  return {
    queuedOperations,
    isProcessing,
    processQueuedOperations,
    clearQueuedOperations,
    hasQueuedOperations: queuedOperations.length > 0,
    refreshQueue,
  };
}
