import { NavLink } from 'react-router-dom';
import { Home, Camera, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/capture', icon: Camera, label: 'Capture' },
  { to: '/gallery', icon: FolderOpen, label: 'Gallery' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { haptic } = useHaptics();

  const handleNavClick = () => {
    haptic('light');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-desert-sand bg-parchment safe-area-bottom">
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
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
