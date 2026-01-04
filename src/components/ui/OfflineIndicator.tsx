import { useState, useEffect } from 'react';
import { CloudOff, Cloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Fixed position banner showing offline/online status
 */
export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  // Show "back online" message briefly when reconnecting
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowBackOnline(true);
      setIsDismissed(false);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  // Reset dismissed state when going offline
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  // Don't show anything if online and not showing the "back online" message
  if (isOnline && !showBackOnline) {
    return null;
  }

  // Don't show if user dismissed the offline banner
  if (!isOnline && isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-14 left-0 right-0 z-50 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300',
        showBackOnline
          ? 'bg-oxidized-bronze text-bone-white'
          : 'bg-gold-ochre text-charcoal'
      )}
      role="alert"
    >
      {showBackOnline ? (
        <>
          <Cloud className="h-4 w-4" />
          <span>Back online!</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>You are offline. Changes will be synced when connected.</span>
          <button
            onClick={() => setIsDismissed(true)}
            className="ml-2 p-1 rounded-full hover:bg-charcoal/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
