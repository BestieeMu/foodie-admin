import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminOrders from './pages/SuperAdminOrders';
import SuperAdminSettings from './pages/SuperAdminSettings';
import Finance from './pages/Finance';
import SuperFinance from './pages/SuperFinance';
import Reports from './pages/Reports';
import Reviews from './pages/Reviews';
import Customers from './pages/Customers';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainRouter />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function MainRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Super Admin Routes */}
        {user?.role === 'super_admin' && (
          <>
            <Route path="/" element={<SuperAdminDashboard />} />
            <Route path="/orders" element={<SuperAdminOrders />} />
            <Route path="/users" element={<SuperAdminUsers />} />
            <Route path="/finance" element={<SuperFinance />} />
            <Route path="/settings" element={<SuperAdminSettings />} />
          </>
        )}

        {/* Restaurant Admin Routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}