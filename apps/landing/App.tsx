import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ScrollToHash from './components/ScrollToHash';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ExitIntentModal from './components/ExitIntentModal';
import DemoModal from './components/DemoModal';
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CoopManagerDashboard = React.lazy(() => import('./pages/CoopManagerDashboard'));
const FieldAgentDashboard = React.lazy(() => import('./pages/FieldAgentDashboard'));
const AgronomistDashboard = React.lazy(() => import('./pages/AgronomistDashboard'));
const OfftakerDashboard = React.lazy(() => import('./pages/OfftakerDashboard'));
const CaseOfficerDashboard = React.lazy(() => import('./pages/CaseOfficerDashboard'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ProfileSettingsPage = React.lazy(() => import('./pages/ProfileSettingsPage'));
const DashboardLayout = React.lazy(() => import('./components/DashboardLayout'));
import { initPerformanceMonitoring } from './utils/performance';
import ProtectedRoute from './components/ProtectedRoute';
import { Web3Provider } from './components/Web3Provider';
import { Outlet } from 'react-router-dom';

const Web3Wrapper: React.FC = () => {
    return (
        <Web3Provider>
            <Outlet />
        </Web3Provider>
    );
};

/** Wrapper that hides Navbar/Footer on /dashboard/* and /login routes */
const AppShell: React.FC<{ children: React.ReactNode; onOpenDemo: () => void }> = ({ children, onOpenDemo }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLogin = location.pathname === '/login';
  const hideChrome = isDashboard || isLogin;

  return (
    <div className={`min-h-screen flex flex-col font-display ${hideChrome ? '' : 'bg-background-light dark:bg-background-dark'}`}>
      {!hideChrome && <Navbar onOpenDemo={onOpenDemo} />}
      <main className={hideChrome ? '' : 'flex-grow'}>
        {children}
      </main>
      {!hideChrome && <Footer />}
      {!hideChrome && <ExitIntentModal />}
    </div>
  );
};

const App: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <ScrollToHash />
        <React.Suspense fallback={
          <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        }>
          <AppShell onOpenDemo={() => setIsDemoModalOpen(true)}>
            <Routes>
              <Route path="/" element={<LandingPage onOpenDemo={() => setIsDemoModalOpen(true)} />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />

              {/* Wallet-aware Routes: Login + Dashboards */}
              <Route element={<Web3Wrapper />}>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Dashboard Routes — wrapped in DashboardLayout */}
                <Route path="/dashboard/*" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Auditor', 'User']}>
                    <DashboardLayout><Dashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/coop/*" element={
                  <ProtectedRoute allowedRoles={['CoopManager']}>
                    <DashboardLayout><CoopManagerDashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/field/*" element={
                  <ProtectedRoute allowedRoles={['FieldAgent']}>
                    <DashboardLayout><FieldAgentDashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/agro/*" element={
                  <ProtectedRoute allowedRoles={['Agronomist']}>
                    <DashboardLayout><AgronomistDashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/offtaker/*" element={
                  <ProtectedRoute allowedRoles={['Offtaker']}>
                    <DashboardLayout><OfftakerDashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/audit/*" element={
                  <ProtectedRoute allowedRoles={['Auditor']}>
                    <DashboardLayout><Dashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/case/*" element={
                  <ProtectedRoute allowedRoles={['CaseOfficer']}>
                    <DashboardLayout><CaseOfficerDashboard /></DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff', 'Auditor', 'User', 'CoopManager', 'FieldAgent', 'Agronomist', 'Offtaker', 'CaseOfficer']}>
                    <DashboardLayout><ProfileSettingsPage /></DashboardLayout>
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </AppShell>
        </React.Suspense>
        <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      </Router>
    </HelmetProvider>
  );
};

export default App;