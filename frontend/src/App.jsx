import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ExpenseForm from './pages/ExpenseForm';
import AdvanceForm from './pages/AdvanceForm';
import ReimbursementDetail from './pages/ReimbursementDetail';

import AdminSettings from './pages/AdminSettings';
import AuditLogs from './pages/AuditLogs';
import UsersManager from './pages/admin/UsersManager';
import RolesManager from './pages/admin/RolesManager';
import CatalogsManager from './pages/admin/CatalogsManager';
import ApprovalDashboard from './pages/ApprovalDashboard';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import Reconciliation from './pages/finance/Reconciliation';
import CashReplenishment from './pages/finance/CashReplenishment';

import { SettingsProvider } from './context/SettingsContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('App loaded user:', parsedUser); // DEBUG
      setUser(parsedUser);
    }
    setLoading(false);

    // Enforce Light Mode
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme'); // Clear any stored theme preference
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <SettingsProvider>
      <Router basename="/cajachica">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />

          {/* Protected Routes */}
          <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
            <Route path="expenses/edit/:id" element={<ExpenseForm />} />
            <Route path="advances/request" element={<AdvanceForm />} />
            <Route path="reimbursements/:id" element={<ReimbursementDetail />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute user={user} allowedRoles={['Admin', 'Cajero']} />}>
              <Route path="admin/users" element={<UsersManager />} />
              <Route path="admin/roles" element={<RolesManager />} />
              <Route path="admin/catalogs" element={<CatalogsManager />} />
              <Route path="admin/settings" element={<AdminSettings />} />
              <Route path="admin/logs" element={<AuditLogs />} />
            </Route>

            {/* Manager Routes */}
            <Route element={<ProtectedRoute user={user} allowedRoles={['Admin', 'Manager', 'Director', 'Gerente', 'Cajero']} />}>
              <Route path="approvals" element={<ApprovalDashboard />} />
            </Route>

            {/* Finance Routes */}
            <Route element={<ProtectedRoute user={user} allowedRoles={['Admin', 'Finance', 'Cajero']} />}>
              <Route path="finance/dashboard" element={<FinanceDashboard />} />
              <Route path="finance/reconciliation" element={<Reconciliation />} />
              <Route path="finance/replenish" element={<CashReplenishment />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

const ProtectedRoute = ({ user, allowedRoles }) => {
  const context = useOutletContext();
  if (!user) return <Navigate to="/login" replace />;
  // If roles are specified and user role is not in the list, redirect to home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet context={context} />;
};

export default App;
