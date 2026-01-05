import { NavLink } from 'react-router-dom';
import { Home, Camera, FolderOpen, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, labelKey: 'nav.home' },
  { to: '/capture', icon: Camera, labelKey: 'nav.capture' },
  { to: '/gallery', icon: FolderOpen, labelKey: 'nav.gallery' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function BottomNav() {
  const { haptic } = useHaptics();
  const { t } = useTranslation();

  const handleNavClick = () => {
    haptic('light');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-desert-sand bg-parchment safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around touch-spacing">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                // Ensure minimum 44x44px touch target
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium transition-colors touch-target',
                isActive
                  ? 'text-terracotta'
                  : 'text-stone-gray hover:text-sienna'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-6 w-6',
                    isActive ? 'text-terracotta' : 'text-stone-gray'
                  )}
                />
                <span>{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
