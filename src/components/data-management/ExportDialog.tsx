import { useState } from 'react';
import { Download, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  isOpen: boolean;
  artifactId?: string;
  artifactName?: string;
  isExporting: boolean;
  exportProgress: number;
  onExportCurrent: () => Promise<void>;
  onExportAll: () => Promise<void>;
  onClose: () => void;
}

/**
 * Dialog for exporting artifact data
 */
export function ExportDialog({
  isOpen,
  artifactId,
  artifactName,
  isExporting,
  exportProgress,
  onExportCurrent,
  onExportAll,
  onClose,
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<'current' | 'all'>(artifactId ? 'current' : 'all');
  const [completed, setCompleted] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExportError(null);
    try {
      if (exportType === 'current' && artifactId) {
        await onExportCurrent();
      } else {
        await onExportAll();
      }
      setCompleted(true);
      setTimeout(() => {
        setCompleted(false);
        onClose();
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      setExportError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={!isExporting ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-xl bg-aged-paper border border-desert-sand shadow-xl p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-desert-sand/50 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-stone-gray" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-terracotta/10 flex items-center justify-center">
            {completed ? (
              <CheckCircle className="h-8 w-8 text-oxidized-bronze" />
            ) : (
              <Download className="h-8 w-8 text-terracotta" />
            )}
          </div>
        </div>

        {/* Content */}
        <h2 className="font-heading text-xl font-semibold text-charcoal text-center mb-4">
          {completed ? 'Export Complete!' : 'Export Data'}
        </h2>

        {!completed && (
          <>
            {/* Export options */}
            <div className="space-y-3 mb-6">
              {artifactId && (
                <label
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                    exportType === 'current'
                      ? 'border-terracotta bg-terracotta/5'
                      : 'border-desert-sand hover:bg-aged-paper'
                  )}
                >
                  <input
                    type="radio"
                    name="exportType"
                    value="current"
                    checked={exportType === 'current'}
                    onChange={() => setExportType('current')}
                    className="w-4 h-4 text-terracotta"
                  />
                  <div>
                    <p className="font-medium text-charcoal">Export Current Artifact</p>
                    <p className="text-sm text-stone-gray">
                      Export "{artifactName || 'Unnamed Artifact'}" with all data
                    </p>
                  </div>
                </label>
              )}

              <label
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                  exportType === 'all'
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-desert-sand hover:bg-aged-paper'
                )}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={() => setExportType('all')}
                  className="w-4 h-4 text-terracotta"
                />
                <div>
                  <p className="font-medium text-charcoal">Export All Artifacts</p>
                  <p className="text-sm text-stone-gray">
                    Export entire collection as a single JSON file
                  </p>
                </div>
              </label>
            </div>

            {/* Progress bar */}
            {isExporting && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-stone-gray mb-2">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="h-2 bg-desert-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terracotta transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {exportError && (
              <div className="mb-6 p-3 rounded-lg bg-rust-red/10 border border-rust-red/20">
                <p className="text-sm text-rust-red">{exportError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-lg border border-desert-sand bg-bone-white text-charcoal font-medium hover:bg-aged-paper transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-lg bg-terracotta text-bone-white font-medium hover:bg-clay transition-colors disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
