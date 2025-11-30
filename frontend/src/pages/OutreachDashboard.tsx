/**
 * Outreach Dashboard
 * 
 * Automated email outreach management for data providers, suppliers, and buyers
 */
import { useState, useEffect } from 'react';
import {
    Mail,
    Users,
    BarChart2,
    Play,
    Pause,
    Plus,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    MousePointer,
    Upload,
    Filter,
    Search,
    Settings,
    Zap,
    FileText,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

const API_URL = 'http://localhost:3001';

// Types
interface Contact {
    contactid: number;
    email: string;
    firstname: string;
    lastname: string;
    company: string;
    jobtitle?: string;
    contacttype: string;
    status: string;
    leadscore: number;
    source: string;
    createdat: string;
    lastemailsentat?: string;
}

interface Campaign {
    campaignid: number;
    campaignname: string;
    campaigntype: string;
    status: string;
    targetaudience: string;
    totalenrolled: number;
    totalsent: number;
    totalopened: number;
    totalclicked: number;
    totalreplied: number;
    createdat: string;
}

interface AgentStatus {
    isRunning: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
    totalRuns: number;
    emailStats: {
        sent: number;
        queued: number;
        failed: number;
    };
}

interface Analytics {
    totalContacts: number;
    totalEmailsSent: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    byContactType: Record<string, number>;
    byStatus: Record<string, number>;
}

// Tab definitions
type TabId = 'overview' | 'contacts' | 'campaigns' | 'agent' | 'instructions';

export default function OutreachDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [contactFilter, setContactFilter] = useState('all');
    const [showAddContact, setShowAddContact] = useState(false);
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // New contact form
    const [newContact, setNewContact] = useState({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        jobTitle: '',
        contactType: 'supplier',
    });

    // New campaign form
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        type: 'supplier_outreach',
        targetAudience: 'new_leads',
    });

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchContacts(),
                fetchCampaigns(),
                fetchAgentStatus(),
                fetchAnalytics(),
            ]);
        } catch (err) {
            console.error('Error fetching outreach data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/contacts?limit=100`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts || []);
            }
        } catch (err) {
            console.error('Error fetching contacts:', err);
            // Use mock data for demo
            setContacts([
                { contactid: 1, email: 'john@ecosteel.com', firstname: 'John', lastname: 'Smith', company: 'EcoSteel Inc', jobtitle: 'CEO', contacttype: 'supplier', status: 'active', leadscore: 85, source: 'website', createdat: new Date().toISOString() },
                { contactid: 2, email: 'sarah@greenwood.com', firstname: 'Sarah', lastname: 'Chen', company: 'Greenwood Materials', jobtitle: 'Sales Director', contacttype: 'supplier', status: 'contacted', leadscore: 72, source: 'linkedin', createdat: new Date().toISOString() },
                { contactid: 3, email: 'mike@buildingco.com', firstname: 'Mike', lastname: 'Johnson', company: 'BuildingCo', jobtitle: 'Procurement Manager', contacttype: 'buyer', status: 'active', leadscore: 90, source: 'referral', createdat: new Date().toISOString() },
            ]);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/campaigns`);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error('Error fetching campaigns:', err);
            // Use mock data
            setCampaigns([
                { campaignid: 1, campaignname: 'Supplier Acquisition Q4', campaigntype: 'supplier_outreach', status: 'active', targetaudience: 'new_leads', totalenrolled: 150, totalsent: 120, totalopened: 45, totalclicked: 12, totalreplied: 8, createdat: new Date().toISOString() },
                { campaignid: 2, campaignname: 'Data Provider Partnership', campaigntype: 'partnership', status: 'paused', targetaudience: 'data_providers', totalenrolled: 25, totalsent: 25, totalopened: 18, totalclicked: 5, totalreplied: 3, createdat: new Date().toISOString() },
            ]);
        }
    };

    const fetchAgentStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/agent/status`);
            if (res.ok) {
                const data = await res.json();
                setAgentStatus(data);
            }
        } catch (err) {
            console.error('Error fetching agent status:', err);
            setAgentStatus({
                isRunning: false,
                lastRunAt: new Date(Date.now() - 3600000).toISOString(),
                nextRunAt: new Date(Date.now() + 3600000).toISOString(),
                totalRuns: 47,
                emailStats: { sent: 1234, queued: 45, failed: 3 },
            });
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/analytics`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setAnalytics({
                totalContacts: 372,
                totalEmailsSent: 1543,
                openRate: 42.5,
                clickRate: 8.3,
                replyRate: 5.2,
                bounceRate: 1.8,
                unsubscribeRate: 0.5,
                byContactType: { supplier: 245, buyer: 89, data_provider: 38 },
                byStatus: { active: 180, contacted: 95, replied: 45, converted: 32, unsubscribed: 20 },
            });
        }
    };

    const runAgent = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/agent/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                await fetchAgentStatus();
                alert('Agent run started!');
            }
        } catch (err) {
            console.error('Error running agent:', err);
            alert('Agent triggered (demo mode)');
        }
    };

    const addContact = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContact),
            });
            if (res.ok) {
                await fetchContacts();
                setShowAddContact(false);
                setNewContact({ email: '', firstName: '', lastName: '', company: '', jobTitle: '', contactType: 'supplier' });
            }
        } catch (err) {
            console.error('Error adding contact:', err);
            // Demo mode - add locally
            setContacts([...contacts, {
                contactid: contacts.length + 1,
                email: newContact.email,
                firstname: newContact.firstName,
                lastname: newContact.lastName,
                company: newContact.company,
                jobtitle: newContact.jobTitle,
                contacttype: newContact.contactType,
                status: 'active',
                leadscore: 50,
                source: 'manual',
                createdat: new Date().toISOString(),
            }]);
            setShowAddContact(false);
            setNewContact({ email: '', firstName: '', lastName: '', company: '', jobTitle: '', contactType: 'supplier' });
        }
    };

    const createCampaign = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/outreach/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCampaign),
            });
            if (res.ok) {
                await fetchCampaigns();
                setShowCreateCampaign(false);
                setNewCampaign({ name: '', type: 'supplier_outreach', targetAudience: 'new_leads' });
            }
        } catch (err) {
            console.error('Error creating campaign:', err);
            // Demo mode
            setCampaigns([...campaigns, {
                campaignid: campaigns.length + 1,
                campaignname: newCampaign.name,
                campaigntype: newCampaign.type,
                status: 'draft',
                targetaudience: newCampaign.targetAudience,
                totalenrolled: 0,
                totalsent: 0,
                totalopened: 0,
                totalclicked: 0,
                totalreplied: 0,
                createdat: new Date().toISOString(),
            }]);
            setShowCreateCampaign(false);
            setNewCampaign({ name: '', type: 'supplier_outreach', targetAudience: 'new_leads' });
        }
    };

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = searchQuery === '' ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.company?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = contactFilter === 'all' || c.contacttype === contactFilter || c.status === contactFilter;
        return matchesSearch && matchesFilter;
    });

    const tabs = [
        { id: 'overview' as TabId, label: 'Overview', icon: BarChart2 },
        { id: 'contacts' as TabId, label: 'Contacts', icon: Users },
        { id: 'campaigns' as TabId, label: 'Campaigns', icon: Mail },
        { id: 'agent' as TabId, label: 'AI Agent', icon: Zap },
        { id: 'instructions' as TabId, label: 'Instructions', icon: FileText },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400';
            case 'contacted': return 'bg-blue-500/20 text-blue-400';
            case 'replied': return 'bg-purple-500/20 text-purple-400';
            case 'converted': return 'bg-emerald-500/20 text-emerald-400';
            case 'paused': return 'bg-yellow-500/20 text-yellow-400';
            case 'unsubscribed': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-950">
                <DashboardSidebar userType="admin" />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950">
            <DashboardSidebar userType="admin" />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Outreach Dashboard</h1>
                    <p className="text-slate-400">Automated email outreach for suppliers, buyers, and data providers</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-slate-800 pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Users className="w-8 h-8 text-blue-400" />
                                    <span className="text-xs text-slate-500">Total</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics?.totalContacts || 0}</p>
                                <p className="text-slate-400 text-sm">Contacts</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Mail className="w-8 h-8 text-emerald-400" />
                                    <span className="text-xs text-slate-500">Sent</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics?.totalEmailsSent || 0}</p>
                                <p className="text-slate-400 text-sm">Emails Sent</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Eye className="w-8 h-8 text-purple-400" />
                                    <span className="text-xs text-slate-500">Rate</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics?.openRate || 0}%</p>
                                <p className="text-slate-400 text-sm">Open Rate</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <MousePointer className="w-8 h-8 text-yellow-400" />
                                    <span className="text-xs text-slate-500">Rate</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics?.replyRate || 0}%</p>
                                <p className="text-slate-400 text-sm">Reply Rate</p>
                            </div>
                        </div>

                        {/* Agent Status Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${agentStatus?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                    <h3 className="text-lg font-semibold text-white">AI Outreach Agent</h3>
                                </div>
                                <button
                                    onClick={runAgent}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                >
                                    <Play className="w-5 h-5" />
                                    Run Now
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-slate-400 text-sm">Status</p>
                                    <p className={`font-medium ${agentStatus?.isRunning ? 'text-green-400' : 'text-slate-300'}`}>
                                        {agentStatus?.isRunning ? 'Running' : 'Idle'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Last Run</p>
                                    <p className="text-white font-medium">
                                        {agentStatus?.lastRunAt ? new Date(agentStatus.lastRunAt).toLocaleString() : 'Never'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Emails Sent</p>
                                    <p className="text-white font-medium">{agentStatus?.emailStats?.sent || 0}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Queued</p>
                                    <p className="text-white font-medium">{agentStatus?.emailStats?.queued || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Campaigns */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Active Campaigns</h3>
                                <button
                                    onClick={() => setShowCreateCampaign(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Campaign
                                </button>
                            </div>
                            <div className="space-y-4">
                                {campaigns.slice(0, 3).map((campaign) => (
                                    <div key={campaign.campaignid} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">{campaign.campaignname}</p>
                                            <p className="text-slate-400 text-sm">{campaign.totalenrolled} enrolled • {campaign.totalsent} sent</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-emerald-400 font-medium">{campaign.totalopened > 0 ? ((campaign.totalopened / campaign.totalsent) * 100).toFixed(1) : 0}%</p>
                                                <p className="text-slate-500 text-xs">Open Rate</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                    <div className="space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-64 relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <select
                                value={contactFilter}
                                onChange={(e) => setContactFilter(e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Contacts</option>
                                <option value="supplier">Suppliers</option>
                                <option value="buyer">Buyers</option>
                                <option value="data_provider">Data Providers</option>
                                <option value="active">Active</option>
                                <option value="contacted">Contacted</option>
                                <option value="replied">Replied</option>
                            </select>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                            >
                                <Upload className="w-5 h-5" />
                                Import
                            </button>
                            <button
                                onClick={() => setShowAddContact(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Add Contact
                            </button>
                        </div>

                        {/* Contacts Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left px-6 py-4 text-slate-400 font-medium">Contact</th>
                                        <th className="text-left px-6 py-4 text-slate-400 font-medium">Company</th>
                                        <th className="text-left px-6 py-4 text-slate-400 font-medium">Type</th>
                                        <th className="text-left px-6 py-4 text-slate-400 font-medium">Status</th>
                                        <th className="text-left px-6 py-4 text-slate-400 font-medium">Score</th>
                                        <th className="text-left px-6 py-4 text-slate-400 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContacts.map((contact) => (
                                        <tr key={contact.contactid} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-white font-medium">{contact.firstname} {contact.lastname}</p>
                                                    <p className="text-slate-400 text-sm">{contact.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white">{contact.company}</p>
                                                {contact.jobtitle && <p className="text-slate-400 text-sm">{contact.jobtitle}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                                                    {contact.contacttype?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(contact.status)}`}>
                                                    {contact.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${contact.leadscore >= 70 ? 'bg-emerald-500' : contact.leadscore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${contact.leadscore}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-slate-400 text-sm">{contact.leadscore}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 capitalize">{contact.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredContacts.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    No contacts found
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Campaigns Tab */}
                {activeTab === 'campaigns' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Email Campaigns</h2>
                            <button
                                onClick={() => setShowCreateCampaign(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Campaign
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {campaigns.map((campaign) => (
                                <div key={campaign.campaignid} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-1">{campaign.campaignname}</h3>
                                            <p className="text-slate-400 text-sm">
                                                {campaign.campaigntype?.replace('_', ' ')} • {campaign.targetaudience?.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                            {campaign.status === 'active' ? (
                                                <button className="p-2 hover:bg-slate-800 rounded-lg text-yellow-400">
                                                    <Pause className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button className="p-2 hover:bg-slate-800 rounded-lg text-emerald-400">
                                                    <Play className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                                <Settings className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                            <p className="text-2xl font-bold text-white">{campaign.totalenrolled}</p>
                                            <p className="text-slate-400 text-sm">Enrolled</p>
                                        </div>
                                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-400">{campaign.totalsent}</p>
                                            <p className="text-slate-400 text-sm">Sent</p>
                                        </div>
                                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-400">{campaign.totalopened}</p>
                                            <p className="text-slate-400 text-sm">Opened</p>
                                        </div>
                                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                            <p className="text-2xl font-bold text-yellow-400">{campaign.totalclicked}</p>
                                            <p className="text-slate-400 text-sm">Clicked</p>
                                        </div>
                                        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                            <p className="text-2xl font-bold text-emerald-400">{campaign.totalreplied}</p>
                                            <p className="text-slate-400 text-sm">Replied</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent Tab */}
                {activeTab === 'agent' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${agentStatus?.isRunning ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                        <Zap className={`w-8 h-8 ${agentStatus?.isRunning ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">AI Outreach Agent</h3>
                                        <p className={`font-medium ${agentStatus?.isRunning ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {agentStatus?.isRunning ? '● Running' : '○ Idle'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={runAgent}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Play className="w-5 h-5" />
                                    Run Agent Now
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                <div className="p-4 bg-slate-800/50 rounded-lg">
                                    <p className="text-slate-400 text-sm mb-1">Total Runs</p>
                                    <p className="text-2xl font-bold text-white">{agentStatus?.totalRuns || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-lg">
                                    <p className="text-slate-400 text-sm mb-1">Emails Sent</p>
                                    <p className="text-2xl font-bold text-emerald-400">{agentStatus?.emailStats?.sent || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-lg">
                                    <p className="text-slate-400 text-sm mb-1">Queued</p>
                                    <p className="text-2xl font-bold text-yellow-400">{agentStatus?.emailStats?.queued || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-lg">
                                    <p className="text-slate-400 text-sm mb-1">Failed</p>
                                    <p className="text-2xl font-bold text-red-400">{agentStatus?.emailStats?.failed || 0}</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                                <h4 className="text-white font-medium mb-4">Schedule</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-400 text-sm">Last Run</p>
                                        <p className="text-white">{agentStatus?.lastRunAt ? new Date(agentStatus.lastRunAt).toLocaleString() : 'Never'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Next Scheduled Run</p>
                                        <p className="text-white">{agentStatus?.nextRunAt ? new Date(agentStatus.nextRunAt).toLocaleString() : 'Not scheduled'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">How the Agent Works</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">1</div>
                                    <div>
                                        <p className="text-white font-medium">Selects Contacts</p>
                                        <p className="text-slate-400 text-sm">Agent picks contacts based on status, score, and time since last contact</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">2</div>
                                    <div>
                                        <p className="text-white font-medium">Generates Personalized Emails</p>
                                        <p className="text-slate-400 text-sm">Uses AI (Azure OpenAI) to create personalized outreach based on instructions</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">3</div>
                                    <div>
                                        <p className="text-white font-medium">Sends & Tracks</p>
                                        <p className="text-slate-400 text-sm">Sends emails via SMTP and tracks opens, clicks, and replies</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">4</div>
                                    <div>
                                        <p className="text-white font-medium">Updates Lead Scores</p>
                                        <p className="text-slate-400 text-sm">Automatically adjusts lead scores based on engagement</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions Tab */}
                {activeTab === 'instructions' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Agent Instructions</h3>
                                    <p className="text-slate-400 text-sm">Configure how the AI generates emails</p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
                                    <Plus className="w-5 h-5" />
                                    Add Instruction
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'tone', value: 'Professional but friendly. Focus on sustainability benefits.', priority: 100 },
                                    { key: 'company_intro', value: 'GreenChainz is a B2B platform connecting businesses with sustainable suppliers...', priority: 90 },
                                    { key: 'value_proposition', value: 'Access to 500+ verified sustainable suppliers, automated certification tracking...', priority: 85 },
                                    { key: 'call_to_action', value: 'End emails with a soft CTA: offer a 15-minute demo call or free trial.', priority: 80 },
                                    { key: 'length_guidelines', value: 'Keep emails under 200 words. Use short paragraphs.', priority: 60 },
                                ].map((instruction) => (
                                    <div key={instruction.key} className="p-4 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-emerald-400 font-mono text-sm">{instruction.key}</span>
                                            <span className="text-slate-500 text-xs">Priority: {instruction.priority}</span>
                                        </div>
                                        <p className="text-white">{instruction.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Contact Modal */}
                {showAddContact && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-semibold text-white mb-6">Add New Contact</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={newContact.firstName}
                                            onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={newContact.lastName}
                                            onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={newContact.company}
                                        onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        value={newContact.jobTitle}
                                        onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Contact Type</label>
                                    <select
                                        value={newContact.contactType}
                                        onChange={(e) => setNewContact({ ...newContact, contactType: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    >
                                        <option value="supplier">Supplier</option>
                                        <option value="buyer">Buyer</option>
                                        <option value="data_provider">Data Provider</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setShowAddContact(false)}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addContact}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                >
                                    Add Contact
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Campaign Modal */}
                {showCreateCampaign && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-semibold text-white mb-6">Create New Campaign</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Campaign Name</label>
                                    <input
                                        type="text"
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        placeholder="e.g., Q4 Supplier Acquisition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Campaign Type</label>
                                    <select
                                        value={newCampaign.type}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    >
                                        <option value="supplier_outreach">Supplier Outreach</option>
                                        <option value="buyer_outreach">Buyer Outreach</option>
                                        <option value="data_provider_partnership">Data Provider Partnership</option>
                                        <option value="re_engagement">Re-engagement</option>
                                        <option value="newsletter">Newsletter</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Target Audience</label>
                                    <select
                                        value={newCampaign.targetAudience}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    >
                                        <option value="new_leads">New Leads</option>
                                        <option value="contacted">Previously Contacted</option>
                                        <option value="high_score">High Score Leads</option>
                                        <option value="inactive">Inactive Contacts</option>
                                        <option value="all">All Contacts</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setShowCreateCampaign(false)}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createCampaign}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

