import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import DesktopSidebar from './components/DesktopSidebar';
import EventsPage from './app/page';
import EventDetailsPage from './app/events/[id]/page';
import ProfilePage from './app/profile/page';
import ShopPage from './app/shop/page';
import UsersPage from './app/users/page';
import MapPage from './app/map/page';
import ManagementPage from './app/management/page';
import ManagementEventsPage from './app/management/events/page';
import ManagementUsersPage from './app/management/users/page';
import ManagementShopPage from './app/management/shop/page';
import ManagementAchievementsPage from './app/management/achievements/page';
import ProposeEventPage from './app/propose-event/page';
import CatPage from './app/cat/page';

const App: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen max-w-6xl mx-auto bg-white shadow-2xl overflow-hidden md:my-4 md:h-[calc(100vh-2rem)] md:rounded-3xl border border-slate-200 font-sans">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
        <main className="flex-1 overflow-y-auto no-scrollbar relative h-full">
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/management">
              <Route index element={<ManagementPage />} />
              <Route path="events" element={<ManagementEventsPage />} />
              <Route path="users" element={<ManagementUsersPage />} />
              <Route path="shop" element={<ManagementShopPage />} />
              <Route path="achievements" element={<ManagementAchievementsPage />} />
            </Route>
            <Route path="/propose-event" element={<ProposeEventPage />} />
            <Route path="/cat" element={<CatPage />} />
          </Routes>
        </main>
        <div className="md:hidden flex-none">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default App;
