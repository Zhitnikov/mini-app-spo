import React from "react";
import BottomNav from '@/components/BottomNav';
import DesktopSidebar from '@/components/DesktopSidebar';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen max-w-6xl mx-auto bg-white shadow-2xl overflow-hidden md:my-4 md:h-[calc(100vh-2rem)] md:rounded-3xl border border-slate-200">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
        <main className="flex-1 overflow-y-auto no-scrollbar relative h-full">
          <Outlet />
        </main>
        <div className="md:hidden flex-none">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

