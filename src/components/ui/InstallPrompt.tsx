import { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Key for storing dismissed state in localStorage
const INSTALL_DISMISSED_KEY = 'savethepast_install_dismissed';
const INSTALL_DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * PWA Install prompt component with archaeology-themed styling
 * Shows when the app is installable and hasn't been dismissed recently
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if prompt was recently dismissed
  const wasRecentlyDismissed = useCallback(() => {
    try {
      const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        return Date.now() - dismissedTime < INSTALL_DISMISSED_DURATION;
      }
    } catch {
      // localStorage not available
    }
    return false;
  }, []);

  // Handle the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Only show if not recently dismissed
      if (!wasRecentlyDismissed()) {
        setIsVisible(true);
      }
    };

    // Check if already installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    // Check standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [wasRecentlyDismissed]);

  // Handle install button click
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[InstallPrompt] User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('[InstallPrompt] User dismissed the install prompt');
      }
    } catch (error) {
      console.error('[InstallPrompt] Install failed:', error);
    } finally {
      setIsInstalling(false);
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  // Handle dismiss button click
  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
    } catch {
      // localStorage not available
    }
  };

  // Don't render if not visible or already installed
  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md',
        'bg-bone-white rounded-lg shadow-lg border border-desert-sand',
        'transform transition-all duration-300 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-terracotta via-sienna to-clay rounded-t-lg" />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-parchment rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-sienna" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              id="install-prompt-title"
              className="font-heading text-lg font-semibold text-charcoal"
            >
              {t('ui.installPrompt.title')}
            </h3>
            <p
              id="install-prompt-description"
              className="mt-1 text-sm text-stone-gray"
            >
              {t('ui.installPrompt.description')}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full text-stone-gray hover:text-charcoal hover:bg-aged-paper transition-colors"
            aria-label={t('ui.installPrompt.dismiss')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-sm font-medium text-stone-gray bg-aged-paper rounded-md hover:bg-desert-sand transition-colors"
          >
            {t('ui.installPrompt.maybeLater')}
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium text-bone-white rounded-md transition-colors',
              'flex items-center justify-center gap-2',
              isInstalling
                ? 'bg-desert-sand cursor-not-allowed'
                : 'bg-terracotta hover:bg-sienna'
            )}
          >
            {isInstalling ? (
              <>
                <span className="animate-spin">
                  <Download className="w-4 h-4" />
                </span>
                {t('ui.installPrompt.installing')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t('ui.installPrompt.installApp')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
