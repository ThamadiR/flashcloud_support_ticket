import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomizationListUI from './pages/CustomizationListUI';
import SipConfigsListUI from './pages/SipConfigsListUI';
import ServersListUI from './pages/ServersListUI';
import TenantsListUI from './pages/TenantsListUI';
import CompanyListUI from './pages/CompanyListUI';
import AuthenticatedLayout from './components/layouts/AuthenticatedLayout';
import Contacts from './components/layouts/Contacts';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import UserListUI from './pages/UserListUI';
import Profile from './pages/Profile';

import { ThemeProvider } from './context/ThemeContext';
import { DrawerProvider } from './context/DrawerContext';
import { SearchProvider } from './context/SearchContext';

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
        <SearchProvider>
          <BrowserRouter>
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
              <Route path="/" element={
                token ? (
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <Navigate to="/dashboard" />
                ) : (
                  <Navigate to="/login" />
                )
              } />

              <Route path="/login" element={
                !token ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <Navigate to="/dashboard" />
                )
              } />



              {/* Authenticated Routes with Header and Footer */}
              <Route element={<AuthenticatedLayout token={token} />}>
                <Route path="/dashboard" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <Dashboard />
                } />

                <Route path="/companies" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <CompanyListUI token={token!} onUnauthorized={handleLogout} />
                } />

                <Route path="/customizations" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <CustomizationListUI token={token!} onUnauthorized={handleLogout} />
                } />

                <Route path="/sip-configs" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <SipConfigsListUI token={token!} onUnauthorized={handleLogout} />
                } />

                <Route path="/servers" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <ServersListUI token={token!} onUnauthorized={handleLogout} />
                } />

                <Route path="/tenants" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <TenantsListUI token={token!} onUnauthorized={handleLogout} />
                } />

                <Route path="/contacts" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <Contacts token={token!} />
                } />

                <Route path="/users" element={
                  (user?.role || "").toLowerCase() === "ticket agent" ? <Navigate to="/tickets" /> : <UserListUI token={token!} onUnauthorized={handleLogout} />
                } />

                <Route path="/tickets" element={<Tickets />} />

                <Route path="/ticket/:id" element={<TicketDetail />} />

                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </DrawerProvider>
    </ThemeProvider>
  );
}
