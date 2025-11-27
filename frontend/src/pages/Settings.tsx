/**
 * Settings Page
 *
 * User account and application settings
 */
import { useState } from 'react';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  avatar?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  rfqUpdates: boolean;
  orderUpdates: boolean;
  newMessages: boolean;
  priceAlerts: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@greenbuilders.com',
    phone: '+1 (555) 123-4567',
    company: 'Green Builders Inc.',
    role: 'Procurement Manager',
  });

  // Notification State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    rfqUpdates: true,
    orderUpdates: true,
    newMessages: true,
    priceAlerts: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  // Security State
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
  });

  // Preferences State
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'preferences', label: 'Preferences', icon: GlobeAltIcon },
    { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  ];

  const renderToggle = (
    enabled: boolean,
    onChange: (value: boolean) => void,
    label: string,
    description?: string
  ) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-emerald-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Personal Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400">
                    {profile.firstName.charAt(0)}
                    {profile.lastName.charAt(0)}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors">
                      Upload Photo
                    </button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG. Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <div className="relative">
                      <DevicePhoneMobileIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Role / Title</label>
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Company Tab */}
            {activeTab === 'company' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Company Information</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name</label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Industry</label>
                      <select className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500">
                        <option>Construction</option>
                        <option>Architecture</option>
                        <option>Manufacturing</option>
                        <option>Engineering</option>
                        <option>Real Estate Development</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company Size</label>
                      <select className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500">
                        <option>1-10 employees</option>
                        <option>11-50 employees</option>
                        <option>51-200 employees</option>
                        <option>201-500 employees</option>
                        <option>500+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <textarea
                      rows={3}
                      placeholder="Street address, City, State, ZIP"
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      placeholder="https://your-company.com"
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>

                <div className="space-y-6">
                  {/* Channel Preferences */}
                  <div>
                    <h3 className="font-medium text-gray-300 mb-3">Channels</h3>
                    <div className="space-y-1 divide-y divide-gray-700">
                      {renderToggle(
                        notifications.emailNotifications,
                        (v) => setNotifications({ ...notifications, emailNotifications: v }),
                        'Email Notifications',
                        'Receive notifications via email'
                      )}
                      {renderToggle(
                        notifications.pushNotifications,
                        (v) => setNotifications({ ...notifications, pushNotifications: v }),
                        'Push Notifications',
                        'Browser and mobile push notifications'
                      )}
                    </div>
                  </div>

                  {/* Activity Preferences */}
                  <div>
                    <h3 className="font-medium text-gray-300 mb-3">Activity Updates</h3>
                    <div className="space-y-1 divide-y divide-gray-700">
                      {renderToggle(
                        notifications.rfqUpdates,
                        (v) => setNotifications({ ...notifications, rfqUpdates: v }),
                        'RFQ Updates',
                        'New quotes, status changes, expirations'
                      )}
                      {renderToggle(
                        notifications.orderUpdates,
                        (v) => setNotifications({ ...notifications, orderUpdates: v }),
                        'Order Updates',
                        'Shipping, delivery, and order status'
                      )}
                      {renderToggle(
                        notifications.newMessages,
                        (v) => setNotifications({ ...notifications, newMessages: v }),
                        'New Messages',
                        'Messages from suppliers and buyers'
                      )}
                      {renderToggle(
                        notifications.priceAlerts,
                        (v) => setNotifications({ ...notifications, priceAlerts: v }),
                        'Price Alerts',
                        'Price changes on watched products'
                      )}
                    </div>
                  </div>

                  {/* Marketing */}
                  <div>
                    <h3 className="font-medium text-gray-300 mb-3">Marketing</h3>
                    <div className="space-y-1 divide-y divide-gray-700">
                      {renderToggle(
                        notifications.weeklyDigest,
                        (v) => setNotifications({ ...notifications, weeklyDigest: v }),
                        'Weekly Digest',
                        'Summary of platform activity and insights'
                      )}
                      {renderToggle(
                        notifications.marketingEmails,
                        (v) => setNotifications({ ...notifications, marketingEmails: v }),
                        'Marketing Emails',
                        'Product updates and promotional offers'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">Security Settings</h2>

                  <div className="space-y-6">
                    {/* Password */}
                    <div>
                      <h3 className="font-medium text-gray-300 mb-3">Password</h3>
                      <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <KeyIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                          Change
                        </button>
                      </div>
                    </div>

                    {/* 2FA */}
                    <div>
                      <h3 className="font-medium text-gray-300 mb-3">Two-Factor Authentication</h3>
                      <div className="space-y-1">
                        {renderToggle(
                          security.twoFactorEnabled,
                          (v) => setSecurity({ ...security, twoFactorEnabled: v }),
                          'Enable 2FA',
                          'Add an extra layer of security with authenticator app'
                        )}
                      </div>
                    </div>

                    {/* Login Alerts */}
                    <div>
                      <h3 className="font-medium text-gray-300 mb-3">Login Security</h3>
                      <div className="space-y-1 divide-y divide-gray-700">
                        {renderToggle(
                          security.loginAlerts,
                          (v) => setSecurity({ ...security, loginAlerts: v }),
                          'Login Alerts',
                          'Get notified of new logins to your account'
                        )}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="font-medium">Session Timeout</p>
                            <p className="text-sm text-gray-400">Auto logout after inactivity</p>
                          </div>
                          <select
                            value={security.sessionTimeout}
                            onChange={(e) =>
                              setSecurity({ ...security, sessionTimeout: Number(e.target.value) })
                            }
                            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={240}>4 hours</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="font-bold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                          <DevicePhoneMobileIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium">Windows • Chrome</p>
                          <p className="text-sm text-gray-500">Current session • New York, US</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-900/30 rounded">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">iPhone • Safari</p>
                          <p className="text-sm text-gray-500">2 days ago • New York, US</p>
                        </div>
                      </div>
                      <button className="text-sm text-red-400 hover:underline">Revoke</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">App Preferences</h2>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'light', icon: SunIcon, label: 'Light' },
                        { value: 'dark', icon: MoonIcon, label: 'Dark' },
                        { value: 'system', icon: DevicePhoneMobileIcon, label: 'System' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value as typeof theme)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                            theme === option.value
                              ? 'border-emerald-500 bg-emerald-900/20'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <option.icon className="w-5 h-5" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="en">English (US)</option>
                      <option value="en-gb">English (UK)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  {/* Units */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Measurement Units</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'metric', label: 'Metric (kg, m)' },
                        { value: 'imperial', label: 'Imperial (lb, ft)' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setUnits(option.value as typeof units)}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                            units === option.value
                              ? 'border-emerald-500 bg-emerald-900/20'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">Subscription</h2>

                  <div className="flex items-center justify-between p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Professional Plan</span>
                        <span className="text-xs px-2 py-0.5 bg-emerald-600 rounded-full">Active</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        $99/month • Renews on Feb 1, 2024
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                      Manage Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-400">∞</p>
                      <p className="text-sm text-gray-500">RFQs/month</p>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold">50</p>
                      <p className="text-sm text-gray-500">Products</p>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold">5</p>
                      <p className="text-sm text-gray-500">Team Members</p>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-400">✓</p>
                      <p className="text-sm text-gray-500">API Access</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="font-bold mb-4">Payment Method</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-500">Expires 12/25</p>
                      </div>
                    </div>
                    <button className="text-sm text-emerald-400 hover:underline">Update</button>
                  </div>
                </div>

                {/* Billing History */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="font-bold mb-4">Billing History</h3>
                  <div className="space-y-2">
                    {[
                      { date: 'Jan 1, 2024', amount: '$99.00', status: 'Paid' },
                      { date: 'Dec 1, 2023', amount: '$99.00', status: 'Paid' },
                      { date: 'Nov 1, 2023', amount: '$99.00', status: 'Paid' },
                    ].map((invoice, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">{invoice.date}</span>
                          <span className="font-medium">{invoice.amount}</span>
                          <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded">
                            {invoice.status}
                          </span>
                        </div>
                        <button className="text-sm text-gray-400 hover:text-white">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-end gap-4">
              {saved && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckIcon className="w-5 h-5" />
                  Changes saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
