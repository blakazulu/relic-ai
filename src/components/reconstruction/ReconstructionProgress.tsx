import { X, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReconstructionStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface ReconstructionProgressProps {
  status: ReconstructionStatus;
  progress: number;
  statusMessage?: string;
  errorMessage?: string;
  onCancel?: () => void;
  className?: string;
}

const statusConfig: Record<ReconstructionStatus, {
  icon: typeof Loader2;
  label: string;
  color: string;
}> = {
  idle: {
    icon: Upload,
    label: 'Ready to upload',
    color: 'text-stone-gray',
  },
  uploading: {
    icon: Loader2,
    label: 'Uploading images...',
    color: 'text-terracotta',
  },
  processing: {
    icon: Loader2,
    label: 'Processing...',
    color: 'text-desert-teal',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Complete',
    color: 'text-oxidized-bronze',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'text-rust-red',
  },
};

export function ReconstructionProgress({
  status,
  progress,
  statusMessage,
  errorMessage,
  onCancel,
  className,
}: ReconstructionProgressProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === 'uploading' || status === 'processing';
  const canCancel = status === 'uploading' || status === 'processing';

  // Ensure progress is clamped between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full', className)}>
      {/* Status header with icon and cancel button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'w-5 h-5',
              config.color,
              isAnimated && 'animate-spin'
            )}
          />
          <span className={cn('font-medium text-sm', config.color)}>
            {config.label}
          </span>
        </div>

        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-gray hover:text-rust-red hover:bg-rust-red/10 rounded-lg transition-colors"
            aria-label="Cancel reconstruction"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-desert-sand/40 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out',
            status === 'completed' && 'bg-oxidized-bronze',
            status === 'error' && 'bg-rust-red',
            status === 'uploading' && 'bg-terracotta',
            status === 'processing' && 'bg-desert-teal',
            status === 'idle' && 'bg-stone-gray'
          )}
          style={{ width: `${clampedProgress}%` }}
        />

        {/* Animated shimmer for active states */}
        {isAnimated && (
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>

      {/* Progress percentage */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-stone-gray text-sm">
          {statusMessage || getDefaultMessage(status, clampedProgress)}
        </p>
        <span className="text-charcoal font-medium text-sm tabular-nums">
          {clampedProgress}%
        </span>
      </div>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rust-red/10 border border-rust-red/30">
          <div className="flex gap-2 text-sm text-rust-red">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success message */}
      {status === 'completed' && (
        <div className="mt-3 p-3 rounded-xl bg-oxidized-bronze/10 border border-oxidized-bronze/30">
          <div className="flex gap-2 text-sm text-oxidized-bronze">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>3D reconstruction complete! View your artifact model.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultMessage(status: ReconstructionStatus, progress: number): string {
  switch (status) {
    case 'idle':
      return 'Select images to begin reconstruction';
    case 'uploading':
      return `Uploading images to server...`;
    case 'processing':
      if (progress < 30) {
        return 'Analyzing image features...';
      } else if (progress < 60) {
        return 'Matching feature points...';
      } else if (progress < 90) {
        return 'Building 3D geometry...';
      } else {
        return 'Finalizing reconstruction...';
      }
    case 'completed':
      return 'Reconstruction finished successfully';
    case 'error':
      return 'An error occurred during reconstruction';
    default:
      return '';
  }
}
