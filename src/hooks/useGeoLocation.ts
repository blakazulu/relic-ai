import { useState, useCallback, useEffect } from 'react';

/**
 * Coordinates returned by the geolocation API
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

/**
 * State of the geolocation hook
 */
export type GeoLocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

/**
 * Options for geolocation request
 */
export interface GeoLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Return type for the useGeoLocation hook
 */
export interface UseGeoLocationReturn {
  /** Current coordinates if available */
  coordinates: GeoCoordinates | null;
  /** Current state of the geolocation request */
  state: GeoLocationState;
  /** Error message if state is 'error' or 'denied' */
  error: string | null;
  /** Request location permission and get coordinates */
  requestLocation: () => Promise<GeoCoordinates | null>;
  /** Clear the current location */
  clearLocation: () => void;
  /** Whether geolocation is supported in this browser */
  isSupported: boolean;
  /** Whether we're currently requesting location */
  isLoading: boolean;
}

/**
 * Hook for handling geolocation/GPS functionality
 *
 * Features:
 * - Request location permissions
 * - Get current coordinates with accuracy
 * - Handle permission denied
 * - Handle geolocation errors
 */
export function useGeoLocation(options: GeoLocationOptions = {}): UseGeoLocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [state, setState] = useState<GeoLocationState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Check if geolocation is supported
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  /**
   * Clear the current location
   */
  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setState('idle');
    setError(null);
  }, []);

  /**
   * Request location permission and get coordinates
   */
  const requestLocation = useCallback(async (): Promise<GeoCoordinates | null> => {
    if (!isSupported) {
      setState('unavailable');
      setError('Geolocation is not supported in this browser');
      return null;
    }

    setState('requesting');
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeoCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };

          setCoordinates(coords);
          setState('granted');
          setError(null);
          resolve(coords);
        },
        (err) => {
          let errorMessage: string;
          let newState: GeoLocationState;

          switch (err.code) {
            case err.PERMISSION_DENIED:
              newState = 'denied';
              errorMessage = 'Location permission was denied';
              break;
            case err.POSITION_UNAVAILABLE:
              newState = 'unavailable';
              errorMessage = 'Location information is unavailable';
              break;
            case err.TIMEOUT:
              newState = 'error';
              errorMessage = 'Location request timed out';
              break;
            default:
              newState = 'error';
              errorMessage = 'An unknown error occurred while getting location';
          }

          setState(newState);
          setError(errorMessage);
          setCoordinates(null);
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  // Check initial permission state if available
  useEffect(() => {
    if (!isSupported) {
      setState('unavailable');
      return;
    }

    // Check if permissions API is available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setState('denied');
          setError('Location permission was previously denied');
        }
      }).catch(() => {
        // Permissions API not fully supported, stay in idle state
      });
    }
  }, [isSupported]);

  return {
    coordinates,
    state,
    error,
    requestLocation,
    clearLocation,
    isSupported,
    isLoading: state === 'requesting',
  };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: GeoCoordinates): string {
  const latDir = coords.latitude >= 0 ? 'N' : 'S';
  const lngDir = coords.longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(coords.latitude).toFixed(6)}° ${latDir}, ${Math.abs(coords.longitude).toFixed(6)}° ${lngDir}`;
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(accuracy: number): string {
  if (accuracy < 10) return `±${accuracy.toFixed(0)}m (excellent)`;
  if (accuracy < 50) return `±${accuracy.toFixed(0)}m (good)`;
  if (accuracy < 100) return `±${accuracy.toFixed(0)}m (moderate)`;
  return `±${accuracy.toFixed(0)}m (poor)`;
}
