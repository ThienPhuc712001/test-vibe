'use client';

import { useState } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import DashboardOverview from '@/components/admin/DashboardOverview';
import UserManagement from '@/components/admin/UserManagement';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import Analytics from '@/components/admin/Analytics';
import Settings from '@/components/admin/Settings';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNavigation activeItem={activeView} onNavigate={setActiveView} />
      <div className="flex-1 lg:ml-64">
        <main className="py-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}