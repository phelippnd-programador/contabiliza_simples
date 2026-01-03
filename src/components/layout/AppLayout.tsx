import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './header/AppHeader';

const AppLayout = () => {
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const isDark = stored === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-100 text-gray-900 dark:bg-slate-900 dark:text-gray-100">
      <AppHeader />
      <main className="flex-1 overflow-auto px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
