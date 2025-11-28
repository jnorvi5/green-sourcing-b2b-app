/**
 * Account Settings Page
 * 
 * User profile, company info, notification preferences,
 * and API key management
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    UserCircleIcon,
    BuildingOfficeIcon,
    BellIcon,
    KeyIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    ArrowLeftIcon,
    CheckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    avatarUrl?: string;
}

interface CompanyInfo {
    name: string;
    website: string;
    industry: string;
    size: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

interface NotificationPrefs {
    emailRfqUpdates: boolean;
    emailNewMaterials: boolean;
    emailDigest: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
}

export default function AccountSettings() {
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'notifications' | 'security' | 'billing'>('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [profile, setProfile] = useState<UserProfile>({
        firstName: 'John',
        lastName: 'Architect',
        email: 'john@lpadesign.com',
        phone: '+1 555-123-4567',
        role: 'Senior Architect',
    });

    const [company, setCompany] = useState<CompanyInfo>({
        name: 'LPA Design Studios',
        website: 'https://lpadesign.com',
        industry: 'Architecture',
        size: '51-200',
        address: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'United States',
    });

    const [notifications, setNotifications] = useState<NotificationPrefs>({
        emailRfqUpdates: true,
        emailNewMaterials: true,
        emailDigest: false,
        pushEnabled: true,
        smsEnabled: false,
    });

    const [showApiKey, setShowApiKey] = useState(false);
    const apiKey = 'grnz_live_xK9v2mNpQrStUvWx...';

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: UserCircleIcon },
        { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
        { id: 'notifications', label: 'Notifications', icon: BellIcon },
        { id: 'security', label: 'Security', icon: ShieldCheckIcon },
        { id: 'billing', label: 'Billing', icon: CreditCardIcon },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/dashboard/buyer"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your profile, company information, and preferences
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <nav className="bg-card border border-border rounded-xl p-2 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="bg-card border border-border rounded-xl p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground mb-6">Personal Information</h2>

                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                                            {profile.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <UserCircleIcon className="w-16 h-16 text-muted-foreground" />
                                            )}
                                        </div>
                                        <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                                            Change Photo
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={profile.firstName}
                                                onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={profile.lastName}
                                                onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={profile.phone}
                                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-foreground mb-2">Role / Title</label>
                                            <input
                                                type="text"
                                                value={profile.role}
                                                onChange={e => setProfile({ ...profile, role: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Company Tab */}
                            {activeTab === 'company' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground mb-6">Company Information</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                                            <input
                                                type="text"
                                                value={company.name}
                                                onChange={e => setCompany({ ...company, name: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                                            <input
                                                type="url"
                                                value={company.website}
                                                onChange={e => setCompany({ ...company, website: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Industry</label>
                                            <select
                                                value={company.industry}
                                                onChange={e => setCompany({ ...company, industry: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="Architecture">Architecture</option>
                                                <option value="Construction">Construction</option>
                                                <option value="Engineering">Engineering</option>
                                                <option value="Interior Design">Interior Design</option>
                                                <option value="Real Estate Development">Real Estate Development</option>
                                                <option value="Manufacturing">Manufacturing</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Company Size</label>
                                            <select
                                                value={company.size}
                                                onChange={e => setCompany({ ...company, size: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="1-10">1-10 employees</option>
                                                <option value="11-50">11-50 employees</option>
                                                <option value="51-200">51-200 employees</option>
                                                <option value="201-500">201-500 employees</option>
                                                <option value="500+">500+ employees</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                                            <input
                                                type="text"
                                                value={company.address}
                                                onChange={e => setCompany({ ...company, address: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">City</label>
                                            <input
                                                type="text"
                                                value={company.city}
                                                onChange={e => setCompany({ ...company, city: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">State / Province</label>
                                            <input
                                                type="text"
                                                value={company.state}
                                                onChange={e => setCompany({ ...company, state: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">ZIP / Postal Code</label>
                                            <input
                                                type="text"
                                                value={company.zip}
                                                onChange={e => setCompany({ ...company, zip: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground mb-6">Notification Preferences</h2>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-medium text-foreground mb-4">Email Notifications</h3>
                                            <div className="space-y-4">
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-foreground">RFQ Updates</span>
                                                        <p className="text-sm text-muted-foreground">Get notified when suppliers respond to your RFQs</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.emailRfqUpdates}
                                                        onChange={e => setNotifications({ ...notifications, emailRfqUpdates: e.target.checked })}
                                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-foreground">New Materials</span>
                                                        <p className="text-sm text-muted-foreground">Weekly updates on new verified materials</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.emailNewMaterials}
                                                        onChange={e => setNotifications({ ...notifications, emailNewMaterials: e.target.checked })}
                                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-foreground">Weekly Digest</span>
                                                        <p className="text-sm text-muted-foreground">Summary of your activity and recommendations</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.emailDigest}
                                                        onChange={e => setNotifications({ ...notifications, emailDigest: e.target.checked })}
                                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-6">
                                            <h3 className="font-medium text-foreground mb-4">Other Channels</h3>
                                            <div className="space-y-4">
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-foreground">Push Notifications</span>
                                                        <p className="text-sm text-muted-foreground">Browser notifications for urgent updates</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.pushEnabled}
                                                        onChange={e => setNotifications({ ...notifications, pushEnabled: e.target.checked })}
                                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-foreground">SMS Notifications</span>
                                                        <p className="text-sm text-muted-foreground">Text messages for critical alerts</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.smsEnabled}
                                                        onChange={e => setNotifications({ ...notifications, smsEnabled: e.target.checked })}
                                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground mb-6">Security Settings</h2>

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="font-medium text-foreground mb-4">Change Password</h3>
                                            <div className="space-y-4 max-w-md">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                                                    <input
                                                        type="password"
                                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                                                    <input
                                                        type="password"
                                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                </div>
                                                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-8">
                                            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                                <KeyIcon className="w-5 h-5" />
                                                API Keys
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Use API keys to integrate GreenChainz with your applications
                                            </p>
                                            <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                                                <code className="text-sm font-mono">
                                                    {showApiKey ? apiKey : '•'.repeat(32)}
                                                </code>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        className="px-3 py-1 text-sm border border-border rounded hover:bg-background transition-colors"
                                                    >
                                                        {showApiKey ? 'Hide' : 'Show'}
                                                    </button>
                                                    <button className="px-3 py-1 text-sm border border-border rounded hover:bg-background transition-colors">
                                                        Regenerate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-border pt-8">
                                            <h3 className="font-medium text-foreground mb-4">Two-Factor Authentication</h3>
                                            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                                                    <div>
                                                        <span className="font-medium text-green-800">2FA Enabled</span>
                                                        <p className="text-sm text-green-700">Your account is secured with authenticator app</p>
                                                    </div>
                                                </div>
                                                <button className="px-3 py-1 text-sm text-green-700 border border-green-300 rounded hover:bg-green-100 transition-colors">
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Billing Tab */}
                            {activeTab === 'billing' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground mb-6">Billing & Subscription</h2>

                                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-sm text-primary font-medium">CURRENT PLAN</span>
                                                <h3 className="text-2xl font-bold text-foreground mt-1">Professional</h3>
                                                <p className="text-muted-foreground">$99/month • Billed annually</p>
                                            </div>
                                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                                                Upgrade Plan
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-medium text-foreground mb-4">Payment Method</h3>
                                            <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                                                        VISA
                                                    </div>
                                                    <div>
                                                        <span className="text-foreground">•••• •••• •••• 4242</span>
                                                        <p className="text-sm text-muted-foreground">Expires 12/26</p>
                                                    </div>
                                                </div>
                                                <button className="text-primary hover:underline text-sm">Update</button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium text-foreground mb-4">Billing History</h3>
                                            <div className="border border-border rounded-lg overflow-hidden">
                                                <table className="w-full">
                                                    <thead className="bg-muted">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Date</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Description</th>
                                                            <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Amount</th>
                                                            <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Invoice</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        <tr>
                                                            <td className="px-4 py-3 text-sm text-foreground">Nov 1, 2024</td>
                                                            <td className="px-4 py-3 text-sm text-foreground">Professional Plan</td>
                                                            <td className="px-4 py-3 text-sm text-foreground text-right">$99.00</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button className="text-primary hover:underline text-sm">Download</button>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="px-4 py-3 text-sm text-foreground">Oct 1, 2024</td>
                                                            <td className="px-4 py-3 text-sm text-foreground">Professional Plan</td>
                                                            <td className="px-4 py-3 text-sm text-foreground text-right">$99.00</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button className="text-primary hover:underline text-sm">Download</button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {saved && (
                                        <>
                                            <CheckIcon className="w-5 h-5 text-green-600" />
                                            <span className="text-green-600 text-sm">Changes saved!</span>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
