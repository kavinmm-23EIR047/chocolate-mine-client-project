import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileBottomNav from '../layout/MobileBottomNav';
import EgglessBadge from '../ui/EgglessBadge';
import PureVegBadge from '../ui/PureVegBadge';

const UserLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="bg-success/10 border-y border-success/20 text-success text-center text-[11px] sm:text-sm font-black uppercase tracking-[0.3em] py-3 px-4">
        <div className="inline-flex items-center justify-center flex-wrap gap-2">
          <PureVegBadge className="px-2.5 py-1 rounded-full" />
          <EgglessBadge className="px-2.5 py-1 rounded-full" />
          <span>100% Pure Veg & Eggless cakes across the store</span>
        </div>
      </div>
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default UserLayout;
