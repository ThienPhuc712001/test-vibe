'use client';

import { useState } from 'react';
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Bell,
  Search
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
  { id: 'users', label: 'Users', icon: Users, href: '/users' },
  { id: 'products', label: 'Products', icon: Package, href: '/products' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/orders' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

interface AdminNavigationProps {
  activeItem: string;
  onNavigate: (item: string) => void;
}

export default function AdminNavigation({ activeItem, onNavigate }: AdminNavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Marketplace Admin</h1>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeItem === item.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">A</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Admin User</div>
                <div className="text-xs text-gray-500">admin@marketplace.com</div>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}