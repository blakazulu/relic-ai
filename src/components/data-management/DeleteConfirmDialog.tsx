import { AlertTriangle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  artifactName: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for artifact deletion
 */
export function DeleteConfirmDialog({
  isOpen,
  artifactName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-xl bg-aged-paper border border-desert-sand shadow-xl p-6">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-desert-sand/50 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-stone-gray" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-rust-red/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-rust-red" />
          </div>
        </div>

        {/* Content */}
        <h2 className="font-heading text-xl font-semibold text-charcoal text-center mb-2">
          Delete Artifact?
        </h2>

        <p className="text-stone-gray text-center mb-2">
          Are you sure you want to delete{' '}
          <span className="font-medium text-charcoal">{artifactName}</span>?
        </p>

        <p className="text-sm text-rust-red text-center mb-6">
          This will permanently delete all images, 3D models, info cards, and color variants
          associated with this artifact. This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-lg border border-desert-sand bg-bone-white text-charcoal font-medium hover:bg-aged-paper transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-lg bg-rust-red text-bone-white font-medium hover:bg-rust-red/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <LoadingSpinner size="sm" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
