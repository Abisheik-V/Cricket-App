import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/ui/Layout';
import LoadingSkeleton from './components/ui/LoadingSkeleton';

const SetupPage     = lazy(() => import('./pages/SetupPage'));
const LivePage      = lazy(() => import('./pages/LivePage'));
const ScorecardPage = lazy(() => import('./pages/ScorecardPage'));
const HistoryPage   = lazy(() => import('./pages/HistoryPage'));
const AuthPage      = lazy(() => import('./pages/AuthPage'));
const ShortcutsPage = lazy(() => import('./pages/ShortcutsPage'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route path="/"          element={<SetupPage />} />
          <Route path="/live"      element={<LivePage />} />
          <Route path="/scorecard" element={<ScorecardPage />} />
          <Route path="/history"   element={<HistoryPage />} />
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/shortcuts" element={<ShortcutsPage />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
