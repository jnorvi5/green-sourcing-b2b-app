/**
 * API & Integrations Settings
 *
 * Manage API keys, webhooks, and third-party integrations
 */
import { useState } from 'react';
import {
    KeyIcon,
    BoltIcon,
    PlusIcon,
    TrashIcon,
    ClipboardIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    GlobeAltIcon,
    CodeBracketIcon,
} from '@heroicons/react/24/outline';

    id: string;
    name: string;
    key: string;
    prefix: string;
    createdAt: string;
    lastUsed?: string;
    permissions: string[];
    status: 'active' | 'revoked';
}

interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive' | 'failing';
    secret: string;
    createdAt: string;
    lastTriggered?: string;
    failureCount: number;
}

interface Integration {
    id: string;
    name: string;
    icon: string;
    description: string;
    status: 'connected' | 'disconnected';
    connectedAt?: string;
}

const MOCK_API_KEYS: ApiKey[] = [
    {
        id: 'key1',
        name: 'Production API Key',
        key: 'gc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        prefix: 'gc_live_',
        createdAt: '2024-01-15',
        lastUsed: '2024-01-25T10:30:00Z',
        permissions: ['read:products', 'write:orders', 'read:analytics'],
        status: 'active',
    },
    {
        id: 'key2',
        name: 'Development Key',
        key: 'gc_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        prefix: 'gc_test_',
        createdAt: '2024-01-10',
        lastUsed: '2024-01-24T14:15:00Z',
        permissions: ['read:products', 'read:orders'],
        status: 'active',
    },
];

const MOCK_WEBHOOKS: Webhook[] = [
    {
        id: 'wh1',
        url: 'https://your-app.com/webhooks/greenchainz',
        events: ['order.created', 'order.shipped', 'rfq.received'],
        status: 'active',
        secret: 'whsec_xxxxxxxxxxxx',
        createdAt: '2024-01-12',
        lastTriggered: '2024-01-25T09:15:00Z',
        failureCount: 0,
    },
    {
        id: 'wh2',
        url: 'https://slack.com/hooks/abc123',
        events: ['rfq.received'],
        status: 'failing',
        secret: 'whsec_yyyyyyyyyyyy',
        createdAt: '2024-01-08',
        lastTriggered: '2024-01-20T16:30:00Z',
        failureCount: 3,
    },
];

const AVAILABLE_INTEGRATIONS: Integration[] = [
    {
        id: 'int1',
        name: 'Salesforce',
        icon: '☁️',
        description: 'Sync orders and contacts with Salesforce CRM',
        status: 'connected',
        connectedAt: '2024-01-10',
    },
    {
        id: 'int2',
        name: 'QuickBooks',
        icon: '📊',
        description: 'Automatic invoice sync and accounting',
        status: 'disconnected',
    },
    {
        id: 'int3',
        name: 'Slack',
        icon: '💬',
        description: 'Get notified about orders and RFQs in Slack',
        status: 'connected',
        connectedAt: '2024-01-15',
    },
    {
        id: 'int4',
        name: 'Zapier',
        icon: '⚡',
        description: 'Connect with 5000+ apps via Zapier',
        status: 'disconnected',
    },
    {
        id: 'int5',
        name: 'Microsoft Teams',
        icon: '👥',
        description: 'Team notifications and updates',
        status: 'disconnected',
    },
    {
        id: 'int6',
        name: 'HubSpot',
        icon: '🧡',
        description: 'CRM and marketing automation',
        status: 'disconnected',
    },
];

const WEBHOOK_EVENTS = [
    { value: 'order.created', label: 'Order Created' },
    { value: 'order.shipped', label: 'Order Shipped' },
    { value: 'order.delivered', label: 'Order Delivered' },
    { value: 'rfq.received', label: 'RFQ Received' },
    { value: 'rfq.responded', label: 'RFQ Responded' },
    { value: 'quote.accepted', label: 'Quote Accepted' },
    { value: 'quote.rejected', label: 'Quote Rejected' },
    { value: 'product.updated', label: 'Product Updated' },
];

const API_PERMISSIONS = [
    { value: 'read:products', label: 'Read Products' },
    { value: 'write:products', label: 'Write Products' },
    { value: 'read:orders', label: 'Read Orders' },
    { value: 'write:orders', label: 'Write Orders' },
    { value: 'read:analytics', label: 'Read Analytics' },
    { value: 'read:rfqs', label: 'Read RFQs' },
    { value: 'write:rfqs', label: 'Write RFQs' },
];

export function ApiIntegrations() {
    const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'integrations'>('keys');
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
    const [webhooks, setWebhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
    const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);

    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Form state
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

    const handleCopyKey = async (key: string, keyId: string) => {
        await navigator.clipboard.writeText(key);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleCreateApiKey = () => {
        const newKey: ApiKey = {
            id: `key${Date.now()}`,
            name: newKeyName,
            key: `gc_live_${Math.random().toString(36).substring(2, 34)}`,
            prefix: 'gc_live_',
            createdAt: new Date().toISOString().split('T')[0],
            permissions: newKeyPermissions,
            status: 'active',
        };
        setApiKeys([...apiKeys, newKey]);
        setShowApiKeyModal(false);
        setNewKeyName('');
        setNewKeyPermissions([]);
    };

    const handleRevokeKey = (keyId: string) => {
        setApiKeys(apiKeys.map((k) => (k.id === keyId ? { ...k, status: 'revoked' as const } : k)));
    };

    const handleDeleteKey = (keyId: string) => {
        setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    };

    const handleCreateWebhook = () => {
        const newWebhook: Webhook = {
            id: `wh${Date.now()}`,
            url: newWebhookUrl,
            events: newWebhookEvents,
            status: 'active',
            secret: generateSecureSecret(),
            createdAt: new Date().toISOString().split('T')[0],
            failureCount: 0,
        };
        setWebhooks([...webhooks, newWebhook]);
        setShowWebhookModal(false);
        setNewWebhookUrl('');
        setNewWebhookEvents([]);
    };

    const handleDeleteWebhook = (webhookId: string) => {
        setWebhooks(webhooks.filter((w) => w.id !== webhookId));
    };

    const handleToggleIntegration = (integrationId: string) => {
        setIntegrations(
            integrations.map((i) =>
                i.id === integrationId
                    ? {
                        ...i,
                        status: i.status === 'connected' ? 'disconnected' : 'connected',
                        connectedAt:
                            i.status === 'disconnected' ? new Date().toISOString().split('T')[0] : undefined,
                    }
                    : i
            )
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold">API & Integrations</h1>
                    <p className="text-gray-400">Manage API access and connect third-party services</p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex border-b border-gray-800 mb-8">
                    {[
                        { id: 'keys', label: 'API Keys', icon: KeyIcon },
                        { id: 'webhooks', label: 'Webhooks', icon: BoltIcon },
                        { id: 'integrations', label: 'Integrations', icon: GlobeAltIcon },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* API Keys Tab */}
                {activeTab === 'keys' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold">API Keys</h2>
                                <p className="text-gray-400 text-sm">
                                    Create and manage API keys for programmatic access
                                </p>
                            </div>
                            <button
                                onClick={() => setShowApiKeyModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Create API Key
                            </button>
                        </div>

                        <div className="space-y-4">
                            {apiKeys.map((apiKey) => (
                                <div
                                    key={apiKey.id}
                                    className={`bg-gray-800 border rounded-xl p-6 ${apiKey.status === 'revoked' ? 'border-red-800 opacity-60' : 'border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold">{apiKey.name}</h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs ${apiKey.status === 'active'
                                                            ? 'bg-emerald-900/50 text-emerald-400'
                                                            : 'bg-red-900/50 text-red-400'
                                                        }`}
                                                >
                                                    {apiKey.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Created {apiKey.createdAt}
                                                {apiKey.lastUsed && ` • Last used ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        {apiKey.status === 'active' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRevokeKey(apiKey.id)}
                                                    className="text-sm text-yellow-400 hover:underline"
                                                >
                                                    Revoke
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKey(apiKey.id)}
                                                    className="text-sm text-red-400 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <code className="flex-1 px-4 py-2 bg-gray-900 rounded-lg font-mono text-sm">
                                            {revealedKeys.has(apiKey.id)
                                                ? apiKey.key
                                                : apiKey.prefix + '••••••••••••••••••••••••••'}
                                        </code>
                                        <button
                                            onClick={() =>
                                                setRevealedKeys((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(apiKey.id)) {
                                                        next.delete(apiKey.id);
                                                    } else {
                                                        next.add(apiKey.id);
                                                    }
                                                    return next;
                                                })
                                            }
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            {revealedKeys.has(apiKey.id) ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            {copiedKey === apiKey.id ? (
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <ClipboardIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {apiKey.permissions.map((perm) => (
                                            <span
                                                key={perm}
                                                className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                                            >
                                                {perm}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* API Documentation Link */}
                        <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center">
                                    <CodeBracketIcon className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">API Documentation</h4>
                                    <p className="text-sm text-gray-400">
                                        Learn how to integrate with the GreenChainz API
                                    </p>
                                </div>
                                <a
                                    href="/docs/api"
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    View Docs
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Webhooks Tab */}
                {activeTab === 'webhooks' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Webhooks</h2>
                                <p className="text-gray-400 text-sm">
                                    Receive real-time notifications for events in your account
                                </p>
                            </div>
                            <button
                                onClick={() => setShowWebhookModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Add Webhook
                            </button>
                        </div>

                        <div className="space-y-4">
                            {webhooks.map((webhook) => (
                                <div
                                    key={webhook.id}
                                    className="bg-gray-800 border border-gray-700 rounded-xl p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <code className="text-sm text-emerald-400">{webhook.url}</code>
                                                <span
                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${webhook.status === 'active'
                                                            ? 'bg-emerald-900/50 text-emerald-400'
                                                            : webhook.status === 'failing'
                                                                ? 'bg-red-900/50 text-red-400'
                                                                : 'bg-gray-700 text-gray-400'
                                                        }`}
                                                >
                                                    {webhook.status === 'failing' && (
                                                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                                    )}
                                                    {webhook.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Created {webhook.createdAt}
                                                {webhook.lastTriggered &&
                                                    ` • Last triggered ${new Date(webhook.lastTriggered).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                                <ArrowPathIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWebhook(webhook.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {webhook.status === 'failing' && (
                                        <div className="flex items-center gap-2 mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                                            <span className="text-sm text-red-400">
                                                {webhook.failureCount} consecutive failures. Check your endpoint.
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events.map((event) => (
                                            <span
                                                key={event}
                                                className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                                            >
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">Available Integrations</h2>
                            <p className="text-gray-400 text-sm">
                                Connect GreenChainz with your favorite tools
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {integrations.map((integration) => (
                                <div
                                    key={integration.id}
                                    className="bg-gray-800 border border-gray-700 rounded-xl p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
                                                {integration.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{integration.name}</h3>
                                                {integration.connectedAt && (
                                                    <p className="text-xs text-gray-500">
                                                        Connected {integration.connectedAt}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span
                                            className={`w-2 h-2 rounded-full ${integration.status === 'connected' ? 'bg-emerald-400' : 'bg-gray-600'
                                                }`}
                                        ></span>
                                    </div>

                                    <p className="text-sm text-gray-400 mb-4">{integration.description}</p>

                                    <button
                                        onClick={() => handleToggleIntegration(integration.id)}
                                        className={`w-full py-2 rounded-lg font-medium transition-colors ${integration.status === 'connected'
                                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                            }`}
                                    >
                                        {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create API Key Modal */}
            {showApiKeyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold">Create API Key</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Key Name</label>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g., Production API"
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Permissions</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {API_PERMISSIONS.map((perm) => (
                                        <label
                                            key={perm.value}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newKeyPermissions.includes(perm.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewKeyPermissions([...newKeyPermissions, perm.value]);
                                                    } else {
                                                        setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm.value));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowApiKeyModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateApiKey}
                                disabled={!newKeyName.trim() || newKeyPermissions.length === 0}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Create Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Webhook Modal */}
            {showWebhookModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold">Add Webhook</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Endpoint URL</label>
                                <input
                                    type="url"
                                    value={newWebhookUrl}
                                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                                    placeholder="https://your-app.com/webhooks"
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {WEBHOOK_EVENTS.map((event) => (
                                        <label
                                            key={event.value}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newWebhookEvents.includes(event.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewWebhookEvents([...newWebhookEvents, event.value]);
                                                    } else {
                                                        setNewWebhookEvents(newWebhookEvents.filter((ev) => ev !== event.value));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm">{event.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowWebhookModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateWebhook}
                                disabled={!newWebhookUrl.trim() || newWebhookEvents.length === 0}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Add Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApiIntegrations;
