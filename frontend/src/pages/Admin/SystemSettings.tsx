import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Mail,
  CreditCard,
  Cloud,
  Shield,
  Bell,
  Palette,
  Globe,
  Key,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
} from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';

interface IntegrationStatus {
  name: string;
  connected: boolean;
  lastSync?: string;
  status: string;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  
  const [settings, setSettings] = useState({
    // General
    siteName: 'GreenChainz',
    siteUrl: 'https://greenchainz.com',
    supportEmail: 'support@greenchainz.com',
    timezone: 'America/New_York',
    
    // Email
    smtpHost: 'smtp.mailgun.org',
    smtpPort: '587',
    smtpUser: 'postmaster@mg.greenchainz.com',
    smtpPassword: '********',
    fromEmail: 'noreply@greenchainz.com',
    fromName: 'GreenChainz',
    
    // Payments
    stripeMode: 'test',
    stripePublicKey: 'pk_test_....',
    stripeSecretKey: 'sk_test_....',
    platformFeePercent: '2.5',
    
    // Storage
    storageProvider: 'azure',
    azureConnectionString: '********',
    azureContainer: 'documents',
    
    // Security
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    requireMFA: false,
    passwordMinLength: '8',
    
    // Notifications
    enableEmailNotifications: true,
    enablePushNotifications: true,
    digestFrequency: 'daily',
    
    // Features
    maintenanceMode: false,
    registrationEnabled: true,
    supplierAutoApproval: false,
  });

  useEffect(() => {
    // Mock integrations status
    setIntegrations([
      { name: 'MongoDB Atlas', connected: true, lastSync: new Date().toISOString(), status: 'healthy' },
      { name: 'Stripe', connected: true, lastSync: new Date().toISOString(), status: 'test_mode' },
      { name: 'Azure Blob Storage', connected: true, lastSync: new Date(Date.now() - 3600000).toISOString(), status: 'healthy' },
      { name: 'EC3 API', connected: true, lastSync: new Date(Date.now() - 7200000).toISOString(), status: 'healthy' },
      { name: 'Autodesk APS', connected: true, lastSync: new Date(Date.now() - 1800000).toISOString(), status: 'healthy' },
      { name: 'MailerLite', connected: false, status: 'not_configured' },
      { name: 'Google Analytics', connected: true, status: 'healthy' },
    ]);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Would call API to save settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Would show toast notification
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'storage', label: 'Storage', icon: Cloud },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-500 mt-1">Configure platform settings and integrations</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">General Settings</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
                      <input
                        type="url"
                        value={settings.siteUrl}
                        onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Feature Flags</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.maintenanceMode}
                          onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm">Maintenance Mode</span>
                        <span className="text-xs text-gray-500">(Shows maintenance page to users)</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.registrationEnabled}
                          onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm">Enable User Registration</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.supplierAutoApproval}
                          onChange={(e) => setSettings({ ...settings, supplierAutoApproval: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm">Auto-approve Supplier Applications</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">Email Configuration</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={settings.smtpHost}
                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                      <input
                        type="text"
                        value={settings.smtpPort}
                        onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                      <input
                        type="text"
                        value={settings.smtpUser}
                        onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                      <div className="relative">
                        <input
                          type={showSecrets.smtpPassword ? 'text' : 'password'}
                          value={settings.smtpPassword}
                          onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10"
                        />
                        <button
                          onClick={() => toggleSecret('smtpPassword')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showSecrets.smtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                      <input
                        type="email"
                        value={settings.fromEmail}
                        onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                      <input
                        type="text"
                        value={settings.fromName}
                        onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Send Test Email
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">Payment Configuration</h2>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Test Mode Active</p>
                      <p className="text-sm text-amber-700">Stripe is currently in test mode. Switch to live mode for production.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                      <select
                        value={settings.stripeMode}
                        onChange={(e) => setSettings({ ...settings, stripeMode: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <option value="test">Test Mode</option>
                        <option value="live">Live Mode</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.platformFeePercent}
                        onChange={(e) => setSettings({ ...settings, platformFeePercent: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={settings.stripePublicKey}
                          onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10"
                        />
                        <button
                          onClick={() => copyToClipboard(settings.stripePublicKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showSecrets.stripeSecret ? 'text' : 'password'}
                          value={settings.stripeSecretKey}
                          onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            onClick={() => toggleSecret('stripeSecret')}
                            className="text-gray-400"
                          >
                            {showSecrets.stripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    Open Stripe Dashboard <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Storage Settings */}
              {activeTab === 'storage' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">Storage Configuration</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select
                        value={settings.storageProvider}
                        onChange={(e) => setSettings({ ...settings, storageProvider: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <option value="azure">Azure Blob Storage</option>
                        <option value="s3">AWS S3</option>
                        <option value="gcs">Google Cloud Storage</option>
                        <option value="local">Local Storage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Container/Bucket</label>
                      <input
                        type="text"
                        value={settings.azureContainer}
                        onChange={(e) => setSettings({ ...settings, azureContainer: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Connection String</label>
                      <div className="relative">
                        <input
                          type={showSecrets.storage ? 'text' : 'password'}
                          value={settings.azureConnectionString}
                          onChange={(e) => setSettings({ ...settings, azureConnectionString: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10"
                        />
                        <button
                          onClick={() => toggleSecret('storage')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showSecrets.storage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">Security Configuration</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                      <input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Password Length</label>
                      <input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.requireMFA}
                        onChange={(e) => setSettings({ ...settings, requireMFA: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm">Require MFA for Admin Users</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.enableEmailNotifications}
                        onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm">Enable Email Notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.enablePushNotifications}
                        onChange={(e) => setSettings({ ...settings, enablePushNotifications: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm">Enable Push Notifications</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digest Email Frequency</label>
                    <select
                      value={settings.digestFrequency}
                      onChange={(e) => setSettings({ ...settings, digestFrequency: e.target.value })}
                      className="w-64 border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Integrations */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold border-b pb-3">Connected Services</h2>
                  
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div
                        key={integration.name}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            integration.connected && integration.status === 'healthy'
                              ? 'bg-green-500'
                              : integration.status === 'test_mode'
                              ? 'bg-amber-500'
                              : 'bg-gray-300'
                          }`} />
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-xs text-gray-500">
                              {integration.connected
                                ? integration.status === 'test_mode'
                                  ? 'Connected (Test Mode)'
                                  : `Last sync: ${new Date(integration.lastSync!).toLocaleString()}`
                                : 'Not configured'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.connected ? (
                            <>
                              <button className="p-2 hover:bg-white rounded" title="Sync Now">
                                <RefreshCw className="w-4 h-4 text-gray-500" />
                              </button>
                              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white">
                                Configure
                              </button>
                            </>
                          ) : (
                            <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemSettings;
