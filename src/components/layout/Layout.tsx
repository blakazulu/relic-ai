import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from '@/components/ui';
import { useLanguage } from '@/hooks';

export function Layout() {
  // Initialize language hook to set up RTL direction on <html> element
  useLanguage();

  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      {/* Main content area with padding for fixed header and nav */}
      {/* On mobile: bottom padding for nav. On desktop: no bottom nav, more top padding */}
      <main className="pb-20 pt-14 lg:pb-8 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
