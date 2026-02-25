'use client';

import { useState } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  productGrowth: number;
}

interface ChartData {
  name: string;
  revenue: number;
  orders: number;
  customers: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData] = useState<AnalyticsData>({
    totalRevenue: 125430.50,
    totalOrders: 1847,
    totalCustomers: 892,
    totalProducts: 456,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    customerGrowth: 15.7,
    productGrowth: 5.2,
  });

  const [chartData] = useState<ChartData[]>([
    { name: 'Mon', revenue: 12000, orders: 180, customers: 45 },
    { name: 'Tue', revenue: 15000, orders: 220, customers: 58 },
    { name: 'Wed', revenue: 18000, orders: 260, customers: 62 },
    { name: 'Thu', revenue: 14000, orders: 200, customers: 48 },
    { name: 'Fri', revenue: 22000, orders: 320, customers: 85 },
    { name: 'Sat', revenue: 25000, orders: 380, customers: 95 },
    { name: 'Sun', revenue: 19430.50, orders: 287, customers: 89 },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const MetricCard = ({ 
    title, 
    value, 
    growth, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    growth: number; 
    icon: any; 
    color: string; 
  }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          growth >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {growth >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {Math.abs(growth)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analyticsData.totalRevenue)}
          growth={analyticsData.revenueGrowth}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Orders"
          value={formatNumber(analyticsData.totalOrders)}
          growth={analyticsData.orderGrowth}
          icon={ShoppingCart}
          color="bg-green-500"
        />
        <MetricCard
          title="Total Customers"
          value={formatNumber(analyticsData.totalCustomers)}
          growth={analyticsData.customerGrowth}
          icon={Users}
          color="bg-purple-500"
        />
        <MetricCard
          title="Total Products"
          value={formatNumber(analyticsData.totalProducts)}
          growth={analyticsData.productGrowth}
          icon={Package}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ 
                    height: `${(item.revenue / Math.max(...chartData.map(d => d.revenue))) * 100}%` 
                  }}
                />
                <div className="text-xs text-gray-500">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                  style={{ 
                    height: `${(item.orders / Math.max(...chartData.map(d => d.orders))) * 100}%` 
                  }}
                />
                <div className="text-xs text-gray-500">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Acquisition Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Acquisition</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                style={{ 
                  height: `${(item.customers / Math.max(...chartData.map(d => d.customers))) * 100}%` 
                }}
              />
              <div className="text-xs text-gray-500">{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Growth
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Wireless Bluetooth Headphones</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Electronics</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">234</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$21,018</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  12.5%
                </div>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Smart Watch Pro</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Electronics</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">156</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$46,798</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  8.3%
                </div>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Laptop Stand</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Accessories</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">89</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2,667</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  3.2%
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}