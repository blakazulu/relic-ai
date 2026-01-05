/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API when available
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

/**
 * Vibration patterns for different feedback types
 * Values are in milliseconds
 */
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30], // Short-pause-medium
  error: [50, 30, 50, 30, 50], // Three pulses
};

/**
 * Check if haptic feedback (vibration) is supported
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with the specified pattern
 * Gracefully handles when vibration is not supported
 *
 * @param pattern - The haptic pattern to trigger
 * @returns true if vibration was triggered, false if not supported
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): boolean {
  if (!isHapticsSupported()) {
    return false;
  }

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
    return true;
  } catch {
    // Silently fail if vibration throws an error
    return false;
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): boolean {
  if (!isHapticsSupported()) {
    return false;
  }

  try {
    navigator.vibrate(0);
    return true;
  } catch {
    return false;
  }
}
