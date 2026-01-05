import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/hooks';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const languages = [
  { code: 'en' as const, label: 'English', nativeLabel: 'English', flag: 'EN' },
  { code: 'he' as const, label: 'Hebrew', nativeLabel: 'עברית', flag: 'עב' },
];

export function LanguageSelector({ variant = 'compact', className }: LanguageSelectorProps) {
  const { currentLanguage, toggleLanguage, changeLanguage, isRtl } = useLanguage();

  if (variant === 'compact') {
    // Toggle button for header
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg',
          'text-sm font-medium text-stone-gray hover:text-sienna',
          'hover:bg-aged-paper transition-colors touch-target',
          className
        )}
        aria-label={currentLanguage === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
      >
        <Globe className="w-4 h-4" />
        <span className="font-semibold">{currentLanguage === 'en' ? 'עב' : 'EN'}</span>
      </button>
    );
  }

  // Full selector for settings page
  return (
    <div className={cn('space-y-2', className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-xl',
            'transition-colors touch-target',
            currentLanguage === lang.code
              ? 'bg-terracotta/10 border-2 border-terracotta'
              : 'bg-aged-paper border border-desert-sand hover:border-clay'
          )}
        >
          <div className={cn('flex items-center gap-3', isRtl && 'flex-row-reverse')}>
            <span className="text-lg font-bold text-sienna w-8">{lang.flag}</span>
            <div className={cn(isRtl ? 'text-right' : 'text-left')}>
              <p className="font-medium text-charcoal">{lang.nativeLabel}</p>
              <p className="text-sm text-stone-gray">{lang.label}</p>
            </div>
          </div>
          {currentLanguage === lang.code && (
            <div className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
              <Check className="w-4 h-4 text-bone-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
