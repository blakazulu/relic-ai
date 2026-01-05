import { useLocation, Link, NavLink, useSearchParams } from 'react-router-dom';
import { Home, Camera, FolderOpen, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/ui';

const navItems = [
  { to: '/', icon: Home, labelKey: 'nav.home' },
  { to: '/capture', icon: Camera, labelKey: 'nav.capture' },
  { to: '/gallery', icon: FolderOpen, labelKey: 'nav.gallery' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const isHomePage = location.pathname === '/';

  // Get title based on current path
  const getTitle = () => {
    if (location.pathname.startsWith('/artifact/')) {
      return t('pages.artifact.title');
    }
    // Show PastPalette when in colorize mode
    if (location.pathname === '/capture' && searchParams.get('mode') === 'colorize') {
      return t('pages.capture.pastPaletteTitle');
    }
    const pageTitles: Record<string, string> = {
      '/': t('app.name'),
      '/capture': t('pages.capture.title'),
      '/gallery': t('pages.gallery.title'),
      '/settings': t('pages.settings.title'),
    };
    return pageTitles[location.pathname] || t('app.name');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-desert-sand bg-parchment/95 backdrop-blur-sm safe-area-top">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-14 lg:h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo & Title - Left side */}
          <div className="flex items-center">
            {isHomePage ? (
              <div className="flex items-center gap-2 lg:gap-3">
                <img
                  src="/logo-32.png"
                  alt="Relic AI"
                  className="w-8 h-8 lg:w-10 lg:h-10 object-contain"
                />
                <h1 className="font-heading text-lg lg:text-xl font-semibold text-sienna">
                  Relic AI
                </h1>
              </div>
            ) : (
              <Link to="/" className="flex items-center gap-2 lg:gap-3 transition-opacity hover:opacity-80">
                <img
                  src="/logo-32.png"
                  alt="Relic AI"
                  className="w-6 h-6 lg:w-8 lg:h-8 object-contain"
                />
                <span className="font-heading text-lg lg:text-xl font-semibold text-sienna hidden lg:block">
                  Relic AI
                </span>
              </Link>
            )}
          </div>

          {/* Mobile: Page title (centered) */}
          {!isHomePage && (
            <h1 className="font-heading text-lg font-semibold text-sienna lg:hidden absolute left-1/2 -translate-x-1/2">
              {getTitle()}
            </h1>
          )}

          {/* Desktop Navigation - Right side */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-terracotta/10 text-terracotta'
                      : 'text-stone-gray hover:text-sienna hover:bg-aged-paper'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          {/* Language selector */}
          <div className="flex items-center">
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}
