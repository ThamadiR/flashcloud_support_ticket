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
import { ThemeProvider } from './context/ThemeContext';

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
          
          <Route path="/dashboard" element={
            token ? <Dashboard token={token} user={user} onLogout={handleLogout} onUserUpdate={setUser} /> : <Navigate to="/login" />
          } />

          <Route path="/customizations" element={
            token ? <CustomizationListUI token={token} onUnauthorized={handleLogout} /> : <Navigate to="/login" />
          } />

          <Route path="/sip-configs" element={
            token ? <SipConfigsListUI token={token} onUnauthorized={handleLogout} /> : <Navigate to="/login" />
          } />

          <Route path="/servers" element={
            token ? <ServersListUI token={token} onUnauthorized={handleLogout} /> : <Navigate to="/login" />
          } />

          <Route path="/tenants" element={
            token ? <TenantsListUI token={token} onUnauthorized={handleLogout} /> : <Navigate to="/login" />
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
