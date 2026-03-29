import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import RealtimeIndicator from './components/RealtimeIndicator';

const PageTransition = lazy(() => import('./components/PageTransition'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ToolMakerPage = lazy(() => import('./pages/ToolMakerPage'));
const StackBuilderEnhancedPage = lazy(() => import('./pages/StackBuilderEnhancedPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const CommunityFeedPage = lazy(() => import('./pages/CommunityFeedPage'));
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'));
const UserProfileSettingsPage = lazy(() => import('./pages/UserProfileSettingsPage'));
const ToolSubmissionPage = lazy(() => import('./pages/ToolSubmissionPage'));
const ModeSwitchPage = lazy(() => import('./pages/ModeSwitchPage'));
const AdminPipelinePage = lazy(() => import('./pages/AdminPipelinePage'));
const CategoriesBrowserPage = lazy(() => import('./pages/CategoriesBrowserPage'));
const SystemAnalyticsPage = lazy(() => import('./pages/SystemAnalyticsPage'));

// Design System & Styles
import './styles/design-system.css';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const hasPrefetchedRoutes = useRef(false);
  const location = useLocation();

  useEffect(() => {
    if (!authResolved) return;
    if (hasPrefetchedRoutes.current) return;

    const currentPath = (location.pathname || '').toLowerCase();

    const shouldPrefetchRoutes = () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      if (typeof navigator === 'undefined') return true;

      const deviceMemory = Number(navigator.deviceMemory || 0);
      if (deviceMemory > 0 && deviceMemory <= 2) return false;

      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) return true;

      if (connection.saveData) return false;

      const effectiveType = String(connection.effectiveType || '').toLowerCase();
      if (effectiveType === 'slow-2g' || effectiveType === '2g') return false;

      return true;
    };

    const prefetch = () => {
      if (!currentPath.startsWith('/tools')) {
        import('./pages/ToolsPage');
      }

      if (session) {
        if (!currentPath.startsWith('/dashboard')) {
          import('./pages/DashboardPage');
        }
        if (!currentPath.startsWith('/maker')) {
          import('./pages/ToolMakerPage');
        }
      } else {
        if (!currentPath.startsWith('/auth')) {
          import('./pages/AuthPage');
        }
      }
    };

    if (typeof window === 'undefined') return;
    if (!shouldPrefetchRoutes()) return;

    hasPrefetchedRoutes.current = true;

    if ('requestIdleCallback' in window) {
      const callbackId = window.requestIdleCallback(() => {
        prefetch();
      }, { timeout: 1200 });

      return () => {
        window.cancelIdleCallback?.(callbackId);
      };
    }

    const timeoutId = window.setTimeout(prefetch, 700);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authResolved, session, location.pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthResolved(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const currentSession = data.session ?? null;
      setSession(currentSession);
      setAuthResolved(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setAuthResolved(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="app-root grain-overlay">
      <Navbar session={session} />

      <main>
        <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
          <PageTransition>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsPage session={session} />} />
              <Route path="/tools/:toolId" element={<ToolDetailPage />} />
              <Route path="/stack" element={<StackBuilderEnhancedPage session={session} />} />
              <Route path="/build" element={<StackBuilderEnhancedPage session={session} />} />
              <Route path="/collections" element={<CollectionsPage session={session} />} />
              <Route path="/compare" element={<ComparisonPage session={session} />} />
              <Route path="/community" element={<CommunityFeedPage />} />
              <Route path="/submit" element={<ToolSubmissionPage />} />
              <Route path="/settings" element={<UserProfileSettingsPage />} />
              <Route path="/mode-switch" element={<ModeSwitchPage />} />
              <Route path="/pipeline" element={<AdminPipelinePage />} />
              <Route path="/categories" element={<CategoriesBrowserPage />} />
              <Route path="/analytics" element={<SystemAnalyticsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/auth" element={<AuthPage session={session} />} />
              <Route path="/login" element={<AuthPage session={session} />} />
              <Route path="/signup" element={<AuthPage session={session} />} />
              <Route path="/reset-access" element={<PasswordResetPage />} />
              <Route path="/profile" element={<DashboardPage session={session} />} />
              <Route path="/dashboard" element={<DashboardPage session={session} />} />
              <Route path="/maker" element={<ToolMakerPage session={session} />} />
              <Route path="/admin" element={<AdminPage session={session} />} />
            </Routes>
          </PageTransition>
        </Suspense>
      </main>

      <BottomNav />
      <RealtimeIndicator />
      <Footer />
    </div>
  );

}

export default App;
