import {
  Database,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Info,
  ExternalLink,
  Vibrate
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/appStore';
import { isHapticsSupported } from '@/lib/utils';
import { LanguageSelector } from '@/components/ui';

export function SettingsPage() {
  const { theme, setTheme, hapticsEnabled, setHapticsEnabled } = useSettingsStore();
  const hapticsSupported = isHapticsSupported();
  const { t } = useTranslation();

  return (
    <div className="px-4 py-6">
      {/* Theme Settings */}
      <section className="mb-8">
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
          {t('pages.settings.appearance')}
        </h3>
        <div className="rounded-xl bg-aged-paper border border-desert-sand overflow-hidden">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-parchment transition-colors touch-target"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-sienna" />
              ) : (
                <Sun className="h-5 w-5 text-sienna" />
              )}
              <div>
                <p className="font-medium text-charcoal">{t('pages.settings.theme')}</p>
                <p className="text-sm text-stone-gray">
                  {theme === 'dark' ? t('pages.settings.darkMode') : t('pages.settings.lightMode')}
                </p>
              </div>
            </div>
            <div className="relative h-6 w-11 rounded-full bg-desert-sand">
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-terracotta transition-all ${
                  theme === 'dark' ? 'left-5 rtl:left-0.5 rtl:right-5' : 'left-0.5 rtl:left-5 rtl:right-0.5'
                }`}
              />
            </div>
          </button>
        </div>
      </section>

      {/* Language Settings */}
      <section className="mb-8">
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
          {t('pages.settings.language')}
        </h3>
        <LanguageSelector variant="full" />
      </section>

      {/* Mobile Experience */}
      {hapticsSupported && (
        <section className="mb-8">
          <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
            {t('pages.settings.mobileExperience')}
          </h3>
          <div className="rounded-xl bg-aged-paper border border-desert-sand overflow-hidden">
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-parchment transition-colors touch-target"
            >
              <div className="flex items-center gap-3">
                <Vibrate className="h-5 w-5 text-sienna" />
                <div>
                  <p className="font-medium text-charcoal">{t('pages.settings.hapticFeedback')}</p>
                  <p className="text-sm text-stone-gray">
                    {hapticsEnabled ? t('pages.settings.vibrationEnabled') : t('pages.settings.vibrationDisabled')}
                  </p>
                </div>
              </div>
              <div className="relative h-6 w-11 rounded-full bg-desert-sand">
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-terracotta transition-all ${
                    hapticsEnabled ? 'left-5 rtl:left-0.5 rtl:right-5' : 'left-0.5 rtl:left-5 rtl:right-0.5'
                  }`}
                />
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Data Management */}
      <section className="mb-8">
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
          {t('pages.settings.dataManagement')}
        </h3>
        <div className="rounded-xl bg-aged-paper border border-desert-sand overflow-hidden divide-y divide-desert-sand">
          <SettingsButton
            icon={Database}
            title={t('pages.settings.storageUsed')}
            subtitle={t('pages.settings.calculating')}
            onClick={() => {
              // TODO: Show storage details
            }}
          />
          <SettingsButton
            icon={Download}
            title={t('pages.settings.exportAllData')}
            subtitle={t('pages.settings.exportDesc')}
            onClick={() => {
              // TODO: Implement export
              console.log('Export data');
            }}
          />
          <SettingsButton
            icon={Upload}
            title={t('pages.settings.importData')}
            subtitle={t('pages.settings.importDesc')}
            onClick={() => {
              // TODO: Implement import
              console.log('Import data');
            }}
          />
          <SettingsButton
            icon={Trash2}
            title={t('pages.settings.clearAllData')}
            subtitle={t('pages.settings.clearDesc')}
            onClick={() => {
              // TODO: Implement with confirmation
              console.log('Clear all data');
            }}
            destructive
          />
        </div>
      </section>

      {/* About */}
      <section>
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
          {t('pages.settings.about')}
        </h3>
        <div className="rounded-xl bg-aged-paper border border-desert-sand overflow-hidden divide-y divide-desert-sand">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-sienna" />
              <div>
                <p className="font-medium text-charcoal">{t('app.name')}</p>
                <p className="text-sm text-stone-gray">{t('pages.settings.version', { version: '1.0.0' })}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.open('https://github.com/blakazulu/relic-ai', '_blank')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-parchment transition-colors"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-sienna" />
              <div>
                <p className="font-medium text-charcoal">{t('pages.settings.sourceCode')}</p>
                <p className="text-sm text-stone-gray">{t('pages.settings.viewOnGitHub')}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl bg-gold-ochre/10 border border-gold-ochre/30 p-4">
          <p className="text-sm text-stone-gray">
            <span className="font-medium text-gold-ochre">{t('pages.settings.disclaimer')}</span>{' '}
            {t('pages.settings.disclaimerText')}
          </p>
        </div>
      </section>
    </div>
  );
}

interface SettingsButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
  destructive?: boolean;
}

function SettingsButton({
  icon: Icon,
  title,
  subtitle,
  onClick,
  destructive,
}: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 text-left hover:bg-parchment transition-colors touch-target"
    >
      <Icon
        className={`h-5 w-5 ${destructive ? 'text-rust-red' : 'text-sienna'}`}
      />
      <div>
        <p
          className={`font-medium ${
            destructive ? 'text-rust-red' : 'text-charcoal'
          }`}
        >
          {title}
        </p>
        <p className="text-sm text-stone-gray">{subtitle}</p>
      </div>
    </button>
  );
}
