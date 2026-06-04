import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';

function DashboardWrapper() {
  const [connected, setConnected] = useState(false);
  return (
    <AppLayout isWsConnected={connected}>
      <Dashboard onWsStatusChange={setConnected} />
    </AppLayout>
  );
}

import Onboarding from './pages/Onboarding';
import AskAI from './pages/AskAI';
import Forecast from './pages/Forecast';
import Alerts from './pages/Alerts';
import DataExplorer from './pages/DataExplorer';
import Settings from './pages/Settings';

function AskAIWrapper() {
  return (
    <AppLayout>
      <AskAI />
    </AppLayout>
  );
}

function ForecastWrapper() {
  return (
    <AppLayout>
      <Forecast />
    </AppLayout>
  );
}

function AlertsWrapper() {
  return (
    <AppLayout>
      <Alerts />
    </AppLayout>
  );
}

function DataExplorerWrapper() {
  return (
    <AppLayout>
      <DataExplorer />
    </AppLayout>
  );
}

function SettingsWrapper() {
  return (
    <AppLayout>
      <Settings />
    </AppLayout>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Use VITE_GOOGLE_CLIENT_ID or mock placeholder if empty
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234-mock.apps.googleusercontent.com';

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardWrapper />} />
                <Route path="/ask" element={<AskAIWrapper />} />
                <Route path="/forecasting" element={<ForecastWrapper />} />
                <Route path="/alerts" element={<AlertsWrapper />} />
                <Route path="/explorer" element={<DataExplorerWrapper />} />
                <Route path="/settings" element={<SettingsWrapper />} />
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Link to="/" className="text-accent underline text-center block mt-12">Page not found. Return home</Link>} />
            </Routes>
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
