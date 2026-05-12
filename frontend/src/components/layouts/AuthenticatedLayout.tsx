import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';

export default function AuthenticatedLayout({ token }: { token: string | null }) {
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
