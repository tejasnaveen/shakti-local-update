import { StrictMode, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/shared/Notification';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import LoginPage from './components/LoginPage';
import SuperAdminLoginPage from './components/SuperAdminLoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { CompanyAdminDashboard } from './components/CompanyAdmin/CompanyAdminDashboard';
import TeamInchargeDashboard from './components/TeamIncharge';
import { TelecallerDashboard } from './components/TelecallerDashboard/index';
import LandingPage from './pages/landing-page';
import SplashScreen from './components/SplashScreen';
import { ActivityMonitor } from './components/ActivityMonitor';

const getDashboardPath = (role?: string) => {
  switch (role) {
    case 'SuperAdmin': return '/superadmin';
    case 'CompanyAdmin': return '/companyadmin';
    case 'TeamIncharge': return '/teamincharge';
    case 'Telecaller': return '/telecaller';
    default: return '/login';
  }
};

// Component to redirect subdomain to subdomain/login
function SubdomainRedirect() {
  const { subdomain } = useParams();
  return <Navigate to={`/${subdomain}/login`} replace />;
}

// Protected Route for SuperAdmin Login
function ProtectedSuperAdminLogin() {
  const { isAuthenticated } = useAuth();
  const hasAccess = sessionStorage.getItem('shakti_sa_access') === 'true';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <SuperAdminLoginPage />;
}

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Wait for auth to finish loading before rendering routes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Main Domain Routes - Only Landing Page and Super Admin */}
        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route
          path="/superadmin/login"
          element={<ProtectedSuperAdminLogin />}
        />
        <Route
          path="/superadmin"
          element={
            isAuthenticated && user?.role === 'SuperAdmin' ? (
              <SuperAdminDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/superadmin/login" replace />
            )
          }
        />

        {/* Tenant Subdomain Routes - ONLY way to access tenant login */}
        <Route
          path="/:subdomain/login"
          element={<LoginPage />}
        />
        <Route
          path="/:subdomain"
          element={<SubdomainRedirect />}
        />

        {/* Subdomain Dashboard Routes - Keep tenant in URL */}
        <Route
          path="/:subdomain/companyadmin"
          element={
            isAuthenticated && (user?.role === 'CompanyAdmin' || user?.role === 'SuperAdmin') ? (
              <CompanyAdminDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/:subdomain/teamincharge"
          element={
            isAuthenticated && ['TeamIncharge', 'CompanyAdmin', 'SuperAdmin'].includes(user?.role || '') ? (
              <TeamInchargeDashboard user={user!} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/:subdomain/telecaller"
          element={
            isAuthenticated && user ? (
              <TelecallerDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Dashboard Routes - After Login (fallback without subdomain) */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Navigate to={getDashboardPath(user?.role)} replace /> : <Navigate to="/" replace />}
        />
        <Route
          path="/companyadmin"
          element={
            isAuthenticated && (user?.role === 'CompanyAdmin' || user?.role === 'SuperAdmin') ? (
              <CompanyAdminDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/teamincharge"
          element={
            isAuthenticated && ['TeamIncharge', 'CompanyAdmin', 'SuperAdmin'].includes(user?.role || '') ? (
              <TeamInchargeDashboard user={user!} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/telecaller"
          element={
            isAuthenticated && user ? (
              <TelecallerDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch-all - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <StrictMode>
      <AuthProvider>
        <NotificationProvider>
          <ConfirmationProvider>
            <ActivityMonitor>
              <AppContent />
            </ActivityMonitor>
          </ConfirmationProvider>
        </NotificationProvider>
      </AuthProvider>
    </StrictMode>
  );
}

export default App;