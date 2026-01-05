import { useEffect } from 'react';
import { Camera, SwitchCamera, X, AlertCircle, CameraOff } from 'lucide-react';
import { useCamera, useHaptics } from '@/hooks';
import { cn } from '@/lib/utils';
import { CaptureOverlay } from './CaptureOverlay';
import { LoadingSpinner } from '@/components/ui';

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  className?: string;
}

export function CameraView({ onCapture, onClose, className }: CameraViewProps) {
  const { haptic } = useHaptics();
  const {
    videoRef,
    status,
    error,
    isActive,
    isLoading,
    currentFacing,
    capabilities,
    startCamera,
    stopCamera,
    switchCamera,
    captureImage,
  } = useCamera({
    initialFacing: 'environment',
    resolution: {
      width: 1920,
      height: 1080,
    },
  });

  // Start camera when component mounts
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger error haptic when camera fails
  useEffect(() => {
    if (status === 'denied' || status === 'error' || status === 'not-supported') {
      haptic('error');
    }
  }, [status, haptic]);

  const handleSwitchCamera = () => {
    haptic('light');
    switchCamera();
  };

  const handleCapture = async () => {
    haptic('medium'); // Haptic feedback on capture
    const blob = await captureImage();
    if (blob) {
      haptic('success'); // Success feedback
      onCapture(blob);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Permission denied state
  if (status === 'denied') {
    return (
      <div className={cn('fixed inset-0 z-50 bg-charcoal flex flex-col items-center justify-center p-6', className)}>
        <div className="bg-aged-paper rounded-2xl p-8 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-rust-red/10 flex items-center justify-center mx-auto mb-4">
            <CameraOff className="w-8 h-8 text-rust-red" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-2">
            Camera Access Denied
          </h2>
          <p className="text-stone-gray text-sm mb-6">
            {error?.message || 'Please allow camera access in your browser settings to capture artifact photos.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => startCamera()}
              className="w-full py-3 px-4 bg-terracotta text-bone-white rounded-xl font-medium hover:bg-clay transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-transparent text-stone-gray rounded-xl font-medium hover:bg-desert-sand/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not supported state
  if (status === 'not-supported') {
    return (
      <div className={cn('fixed inset-0 z-50 bg-charcoal flex flex-col items-center justify-center p-6', className)}>
        <div className="bg-aged-paper rounded-2xl p-8 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-gold-ochre/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gold-ochre" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-2">
            Camera Not Supported
          </h2>
          <p className="text-stone-gray text-sm mb-6">
            Your browser doesn't support camera access. Please try using a modern browser like Chrome, Safari, or Firefox.
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-terracotta text-bone-white rounded-xl font-medium hover:bg-clay transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className={cn('fixed inset-0 z-50 bg-charcoal flex flex-col items-center justify-center p-6', className)}>
        <div className="bg-aged-paper rounded-2xl p-8 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-rust-red/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rust-red" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-2">
            Camera Error
          </h2>
          <p className="text-stone-gray text-sm mb-6">
            {error?.message || 'An error occurred while accessing the camera.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => startCamera()}
              className="w-full py-3 px-4 bg-terracotta text-bone-white rounded-xl font-medium hover:bg-clay transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-transparent text-stone-gray rounded-xl font-medium hover:bg-desert-sand/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('fixed inset-0 z-50 bg-black', className)}>
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 w-full h-full object-cover',
          currentFacing === 'user' && 'scale-x-[-1]' // Mirror front camera
        )}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-bone-white mt-4">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Capture overlay with guides */}
      {isActive && <CaptureOverlay />}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label="Close camera"
          >
            <X className="w-6 h-6" />
          </button>

          {capabilities?.hasMultipleCameras && (
            <button
              onClick={handleSwitchCamera}
              disabled={!isActive}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors disabled:opacity-50"
              aria-label="Switch camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom">
        <div className="flex items-center justify-center">
          <button
            onClick={handleCapture}
            disabled={!isActive}
            className="w-20 h-20 rounded-full bg-bone-white border-4 border-terracotta flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Capture photo"
          >
            <Camera className="w-8 h-8 text-terracotta" />
          </button>
        </div>

        {/* Camera mode indicator */}
        <p className="text-center text-white/60 text-sm mt-4">
          {currentFacing === 'user' ? 'Front Camera' : 'Back Camera'}
        </p>
      </div>
    </div>
  );
}
