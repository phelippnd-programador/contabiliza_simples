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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <AppHeader />
      <main className="flex-1 overflow-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
