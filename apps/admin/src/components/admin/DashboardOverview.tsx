'use client';

import { useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function DashboardOverview() {
  const [timeRange, setTimeRange] = useState('7d');

  const stats = [
    {
      title: 'Total Revenue',
      value: '$125,430',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Orders',
      value: '1,847',
      change: '+8.3%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      title: 'Total Customers',
      value: '892',
      change: '+15.7%',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Products',
      value: '456',
      change: '+5.2%',
      trend: 'up',
      icon: Package,
      color: 'bg-orange-500'
    }
  ];

  const recentOrders = [
    {
      id: 'ORD-2024-001',
      customer: 'John Doe',
      amount: '$259.98',
      status: 'processing',
      date: '2024-02-20'
    },
    {
      id: 'ORD-2024-002',
      customer: 'Jane Smith',
      amount: '$89.99',
      status: 'shipped',
      date: '2024-02-19'
    },
    {
      id: 'ORD-2024-003',
      customer: 'Bob Johnson',
      amount: '$156.50',
      status: 'delivered',
      date: '2024-02-18'
    }
  ];

  const topProducts = [
    {
      name: 'Wireless Bluetooth Headphones',
      sales: 234,
      revenue: '$21,018'
    },
    {
      name: 'Smart Watch Pro',
      sales: 156,
      revenue: '$46,798'
    },
    {
      name: 'Laptop Stand',
      sales: 89,
      revenue: '$2,667'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 80, 45, 90, 75, 85, 70].map((height, index) => (
              <div key={index} className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Processing</span>
              </div>
              <span className="text-sm font-medium">45</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Shipped</span>
              </div>
              <span className="text-sm font-medium">32</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Delivered</span>
              </div>
              <span className="text-sm font-medium">128</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <span className="text-sm font-medium">8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{order.id}</div>
                    <div className="text-sm text-gray-500">{order.customer}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{order.amount}</div>
                    <div className="text-xs text-gray-500">{order.date}</div>
                  </div>
                  <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.sales} sales</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{product.revenue}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}