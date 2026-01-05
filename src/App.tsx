import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/ui';
import { LoadingScreen } from './components/ui';
import './i18n'; // Initialize i18n
import './index.css';

// Lazy load pages for better performance
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const CapturePage = lazy(() =>
  import('./pages/CapturePage').then((m) => ({ default: m.CapturePage }))
);
const GalleryPage = lazy(() =>
  import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ArtifactDetailPage = lazy(() =>
  import('./pages/ArtifactDetailPage').then((m) => ({
    default: m.ArtifactDetailPage,
  }))
);

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/artifact/:id" element={<ArtifactDetailPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
