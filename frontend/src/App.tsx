import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomizationListUI from './pages/CustomizationListUI';
import SipConfigsListUI from './pages/SipConfigsListUI';
import ServersListUI from './pages/ServersListUI';
import TenantsListUI from './pages/TenantsListUI';
import CompanyListUI from './pages/CompanyListUI';
import AuthenticatedLayout from './components/layouts/AuthenticatedLayout';
import { ThemeProvider } from './context/ThemeContext';
import { DrawerProvider } from './context/DrawerContext';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      return null;
    }
  });

  const handleLogin = (tok: string, usr: any) => {
    setToken(tok);
    setUser(usr);
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [token, user]);

  return (
    <ThemeProvider>
      <DrawerProvider>
        <BrowserRouter>
          <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          
          <Route path="/login" element={
            !token ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />
          } />
          
          <Route path="/register" element={
            !token ? <Register /> : <Navigate to="/dashboard" />
          } />
          
          {/* Authenticated Routes with Header and Footer */}
          <Route element={<AuthenticatedLayout token={token} />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/companies" element={<CompanyListUI token={token!} onUnauthorized={handleLogout} />} />

            <Route path="/customizations" element={
              <CustomizationListUI token={token!} onUnauthorized={handleLogout} />
            } />

            <Route path="/sip-configs" element={
              <SipConfigsListUI token={token!} onUnauthorized={handleLogout} />
            } />

            <Route path="/servers" element={
              <ServersListUI token={token!} onUnauthorized={handleLogout} />
            } />

            <Route path="/tenants" element={
              <TenantsListUI token={token!} onUnauthorized={handleLogout} />
            } />
          </Route>
        </Routes>
      </BrowserRouter>
      </DrawerProvider>
    </ThemeProvider>
  );
}
