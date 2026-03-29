import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ScrollToHash from './components/ScrollToHash';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ExitIntentModal from './components/ExitIntentModal';
import DemoModal from './components/DemoModal';
import LandingPage from './pages/LandingPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import Dashboard from './pages/Dashboard';
import CoopManagerDashboard from './pages/CoopManagerDashboard';
import FieldAgentDashboard from './pages/FieldAgentDashboard';
import AgronomistDashboard from './pages/AgronomistDashboard';
import OfftakerDashboard from './pages/OfftakerDashboard';
import CaseOfficerDashboard from './pages/CaseOfficerDashboard';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import { initPerformanceMonitoring } from './utils/performance';
import ProtectedRoute from './components/ProtectedRoute';

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
        <AppShell onOpenDemo={() => setIsDemoModalOpen(true)}>
          <Routes>
            <Route path="/" element={<LandingPage onOpenDemo={() => setIsDemoModalOpen(true)} />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Dashboard Routes — wrapped in DashboardLayout */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['Staff', 'User']}>
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
          </Routes>
        </AppShell>
        <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      </Router>
    </HelmetProvider>
  );
};

export default App;