'use client';

'use client';

/**
 * Outreach Dashboard Page
 * 
 * Admin interface for managing outreach leads and emails.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ILead,
  LeadStatus,
  LeadType,
  LeadPriority,
  EmailType,
  EmailTone,
} from '../../../types/outreach';
import OutreachStats from './components/OutreachStats';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';

interface CreateLeadForm {
  companyName: string;
  contactName: string;
  email: string;
  role: string;
  phone: string;
  website: string;
  leadType: LeadType;
  source: string;
  priority: LeadPriority;
  notes: string;
  companyDescription: string;
  customHook: string;
}

const initialFormState: CreateLeadForm = {
  companyName: '',
  contactName: '',
  email: '',
  role: '',
  phone: '',
  website: '',
  leadType: LeadType.SUPPLIER,
  source: '',
  priority: LeadPriority.MEDIUM,
  notes: '',
  companyDescription: '',
  customHook: '',
};

export default function OutreachPage() {
  // State
  const [leads, setLeads] = useState<ILead[]>([]);
  const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<LeadType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLeadForm>(initialFormState);
  const [isCreating, setIsCreating] = useState(false);
  
  // Action states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('leadType', typeFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/outreach/leads?${params.toString()}`);
      const data = await response.json() as { success: boolean; leads: ILead[]; error?: string };
      
      if (data.success) {
        setLeads(data.leads);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch leads');
      }
    } catch (err) {
      setError('Network error while fetching leads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Create lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/outreach/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          context: {
            companyDescription: createForm.companyDescription || undefined,
            customHook: createForm.customHook || undefined,
          },
        }),
      });

      const data = await response.json() as { success: boolean; lead?: ILead; error?: string };

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm(initialFormState);
        await fetchLeads();
      } else {
        setError(data.error || 'Failed to create lead');
      }
    } catch (err) {
      setError('Network error while creating lead');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Update selected lead
  const handleUpdateLead = (updatedLead: ILead) => {
    setSelectedLead(updatedLead);
    setLeads(leads.map(l => l._id === updatedLead._id ? updatedLead : l));
  };

  // Generate email
  const handleGenerateEmail = async (emailType: EmailType, tone: EmailTone) => {
    if (!selectedLead?._id) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead._id,
          emailType,
          tone,
        }),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        // Refresh lead to get new email
        const leadResponse = await fetch(`/api/outreach/leads/${selectedLead._id}`);
        const leadData = await leadResponse.json() as { success: boolean; lead?: ILead };
        if (leadData.success && leadData.lead) {
          handleUpdateLead(leadData.lead);
        }
      } else {
        setError(data.error || 'Failed to generate email');
      }
    } catch (err) {
      setError('Network error while generating email');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve email
  const handleApproveEmail = async (emailIndex: number, editedSubject?: string, editedBody?: string) => {
    if (!selectedLead?._id) return;

    try {
      const response = await fetch(`/api/outreach/leads/${selectedLead._id}/approve-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailIndex,
          editedSubject,
          editedBody,
        }),
      });

      const data = await response.json() as { success: boolean; lead?: ILead; error?: string };

      if (data.success && data.lead) {
        handleUpdateLead(data.lead);
      } else {
        setError(data.error || 'Failed to approve email');
      }
    } catch (err) {
      setError('Network error while approving email');
      console.error(err);
    }
  };

  // Send email
  const handleSendEmail = async (emailIndex: number) => {
    if (!selectedLead?._id) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead._id,
          emailIndex,
        }),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        // Refresh lead to get updated email status
        const leadResponse = await fetch(`/api/outreach/leads/${selectedLead._id}`);
        const leadData = await leadResponse.json() as { success: boolean; lead?: ILead };
        if (leadData.success && leadData.lead) {
          handleUpdateLead(leadData.lead);
        }
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      setError('Network error while sending email');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Outreach Dashboard</h1>
            <p className="text-gray-400">Manage leads and AI-powered email campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add Lead
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-100">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <OutreachStats leads={leads} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead List */}
          <div className={selectedLead ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {isLoading ? (
              <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading leads...</p>
              </div>
            ) : (
              <LeadList
                leads={leads}
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
                onStatusFilter={setStatusFilter}
                onTypeFilter={setTypeFilter}
                onSearch={setSearchQuery}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                searchQuery={searchQuery}
              />
            )}
          </div>

          {/* Lead Detail */}
          {selectedLead && (
            <div className="lg:col-span-1">
              <LeadDetail
                lead={selectedLead}
                onUpdate={handleUpdateLead}
                onClose={() => setSelectedLead(null)}
                onGenerateEmail={handleGenerateEmail}
                onApproveEmail={handleApproveEmail}
                onSendEmail={handleSendEmail}
                isGenerating={isGenerating}
                isSending={isSending}
              />
            </div>
          )}
        </div>

        {/* Create Lead Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            
            <div className="relative bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100">Add New Lead</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.companyName}
                      onChange={(e: any) => setCreateForm({ ...createForm, companyName: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.contactName}
                      onChange={(e: any) => setCreateForm({ ...createForm, contactName: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e: any) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Role *</label>
                    <input
                      type="text"
                      required
                      value={createForm.role}
                      onChange={(e: any) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Phone</label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e: any) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Website</label>
                    <input
                      type="url"
                      value={createForm.website}
                      onChange={(e: any) => setCreateForm({ ...createForm, website: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Type *</label>
                    <select
                      required
                      value={createForm.leadType}
                      onChange={(e: any) => setCreateForm({ ...createForm, leadType: e.target.value as LeadType })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    >
                      {Object.values(LeadType).map((type) => (
                        <option key={type} value={type}>
                          {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Source *</label>
                    <input
                      type="text"
                      required
                      placeholder="LinkedIn, Referral, etc."
                      value={createForm.source}
                      onChange={(e: any) => setCreateForm({ ...createForm, source: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={(e: any) => setCreateForm({ ...createForm, priority: e.target.value as LeadPriority })}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
                    >
                      {Object.values(LeadPriority).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Company Description (for AI)</label>
                  <textarea
                    value={createForm.companyDescription}
                    onChange={(e: any) => setCreateForm({ ...createForm, companyDescription: e.target.value })}
                    rows={2}
                    placeholder="Brief description for personalized emails..."
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Custom Hook (why reaching out)</label>
                  <textarea
                    value={createForm.customHook}
                    onChange={(e: any) => setCreateForm({ ...createForm, customHook: e.target.value })}
                    rows={2}
                    placeholder="Reason for reaching out to this specific lead..."
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e: any) => setCreateForm({ ...createForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Internal notes..."
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
