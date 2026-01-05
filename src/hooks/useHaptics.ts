import { useCallback } from 'react';
import { triggerHaptic, isHapticsSupported, type HapticPattern } from '@/lib/utils';
import { useSettingsStore } from '@/stores/appStore';

/**
 * Hook for triggering haptic feedback
 * Respects user preference for haptic feedback enabled/disabled
 */
export function useHaptics() {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  /**
   * Trigger haptic feedback with the specified pattern
   * Only triggers if haptics are enabled in settings and supported by device
   */
  const haptic = useCallback(
    (pattern: HapticPattern = 'light') => {
      if (!hapticsEnabled) {
        return false;
      }
      return triggerHaptic(pattern);
    },
    [hapticsEnabled]
  );

  /**
   * Check if haptics are available and enabled
   */
  const isAvailable = isHapticsSupported() && hapticsEnabled;

  return {
    haptic,
    isAvailable,
    isSupported: isHapticsSupported(),
    isEnabled: hapticsEnabled,
  };
}
