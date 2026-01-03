import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './header/AppHeader';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <AppHeader />
      <main className="flex-1 overflow-auto px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
