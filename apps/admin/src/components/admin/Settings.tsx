'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Palette, Globe, CreditCard, Truck, Mail, Phone } from 'lucide-react';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  timezone: string;
  currency: string;
  language: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  shippingNotifications: boolean;
  reviewNotifications: boolean;
  marketingEmails: boolean;
}

interface PaymentSettings {
  enableStripe: boolean;
  stripePublicKey: string;
  enablePayPal: boolean;
  payPalClientId: string;
  enableVNPay: boolean;
  vnpayTmnCode: string;
  enableMomo: boolean;
  momoPartnerCode: string;
  enableCOD: boolean;
  enableWallet: boolean;
}

interface ShippingSettings {
  freeShippingThreshold: number;
  defaultShippingFee: number;
  enableExpressShipping: boolean;
  expressShippingFee: number;
  enableInternationalShipping: boolean;
  internationalShippingFee: number;
  processingTime: number;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Marketplace Pro',
    siteDescription: 'Your trusted multi-vendor marketplace',
    contactEmail: 'admin@marketplace.com',
    contactPhone: '+1 234 567 8900',
    address: '123 Business St, City, State 12345',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    shippingNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    enableStripe: true,
    stripePublicKey: '',
    enablePayPal: true,
    payPalClientId: '',
    enableVNPay: true,
    vnpayTmnCode: '',
    enableMomo: true,
    momoPartnerCode: '',
    enableCOD: true,
    enableWallet: true,
  });

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 50,
    defaultShippingFee: 5.99,
    enableExpressShipping: true,
    expressShippingFee: 12.99,
    enableInternationalShipping: true,
    internationalShippingFee: 25.99,
    processingTime: 24,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    // Show success message
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={generalSettings.contactPhone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Settings</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900">Payment Methods</h3>
                  {Object.entries(paymentSettings).map(([key, value]) => {
                    if (key.startsWith('enable')) {
                      return (
                        <label key={key} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, [key]: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Settings</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Shipping Threshold ($)
                    </label>
                    <input
                      type="number"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Shipping Fee ($)
                    </label>
                    <input
                      type="number"
                      value={shippingSettings.defaultShippingFee}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, defaultShippingFee: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Enable Express Shipping</span>
                    <input
                      type="checkbox"
                      checked={shippingSettings.enableExpressShipping}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, enableExpressShipping: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  {shippingSettings.enableExpressShipping && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Express Shipping Fee ($)
                      </label>
                      <input
                        type="number"
                        value={shippingSettings.expressShippingFee}
                        onChange={(e) => setShippingSettings({ ...shippingSettings, expressShippingFee: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Security settings are managed through your authentication provider (Clerk).
                    Please visit your Clerk dashboard to configure security policies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Appearance Settings</h2>
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Appearance settings including themes, colors, and branding will be available in the next update.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}