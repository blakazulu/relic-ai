import { useState } from 'react';
import { RefreshCw, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useAppStore } from '@/stores/appStore';
import { formatDate } from '@/lib/utils';

/**
 * Indicator showing queued operations and allowing retry
 */
export function OfflineQueueIndicator() {
  const {
    queuedOperations,
    isProcessing,
    processQueuedOperations,
    clearQueuedOperations,
    hasQueuedOperations,
  } = useOfflineQueue();
  const isOnline = useAppStore((s) => s.isOnline);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!hasQueuedOperations) {
    return null;
  }

  const getOperationLabel = (type: string): string => {
    switch (type) {
      case 'reconstruct3d':
        return '3D Reconstruction';
      case 'generateInfoCard':
        return 'Info Card Generation';
      case 'colorize':
        return 'Colorization';
      default:
        return 'Unknown Operation';
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40">
      <div className="bg-aged-paper border border-desert-sand rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-desert-sand/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-terracotta" />
            </div>
            <div className="text-left">
              <p className="font-medium text-charcoal text-sm">
                {queuedOperations.length} Pending Operation{queuedOperations.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-stone-gray">
                {isOnline ? 'Click to process' : 'Waiting for connection'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-stone-gray" />
          ) : (
            <ChevronUp className="h-4 w-4 text-stone-gray" />
          )}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-desert-sand">
            {/* Operation list */}
            <div className="max-h-48 overflow-y-auto">
              {queuedOperations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between px-3 py-2 border-b border-desert-sand/50 last:border-0"
                >
                  <div>
                    <p className="text-sm text-charcoal">{getOperationLabel(op.type)}</p>
                    <p className="text-xs text-stone-gray">
                      {formatDate(op.createdAt)} • Retry {op.retryCount}/3
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-3 bg-aged-paper/50 border-t border-desert-sand">
              <button
                onClick={processQueuedOperations}
                disabled={!isOnline || isProcessing}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  isOnline
                    ? 'bg-terracotta text-bone-white hover:bg-clay'
                    : 'bg-stone-gray/20 text-stone-gray cursor-not-allowed'
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isProcessing && 'animate-spin')} />
                {isProcessing ? 'Processing...' : 'Process Now'}
              </button>
              <button
                onClick={clearQueuedOperations}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-rust-red/10 text-rust-red hover:bg-rust-red/20 transition-colors disabled:opacity-50"
                aria-label="Clear queue"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
