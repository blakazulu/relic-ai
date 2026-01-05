import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from '@/components/ui';

export function Layout() {
  return (
    <div className="min-h-screen bg-parchment">
      <Header />

      {/* Main content area with padding for fixed header and nav */}
      <main className="pb-20 pt-14">
        <Outlet />
      </main>

      <BottomNav />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
