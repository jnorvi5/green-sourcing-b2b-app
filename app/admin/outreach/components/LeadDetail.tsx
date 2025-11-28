'use client';

/**
 * LeadDetail Component
 * 
 * Displays detailed information about a selected lead.
 */
import React, { useState } from 'react';
import { ILead, IEmail, LeadStatus, EmailStatus, EmailType, EmailTone } from '../../../../types/outreach';
import EmailPreview from './EmailPreview';
import GenerateEmailModal from './GenerateEmailModal';

interface LeadDetailProps {
  lead: ILead;
  onUpdate: (lead: ILead) => void;
  onClose: () => void;
  onGenerateEmail: (emailType: EmailType, tone: EmailTone) => Promise<void>;
  onApproveEmail: (emailIndex: number, editedSubject?: string, editedBody?: string) => Promise<void>;
  onSendEmail: (emailIndex: number) => Promise<void>;
  isGenerating: boolean;
  isSending: boolean;
}

const statusColors: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [LeadStatus.CONTACTED]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  [LeadStatus.RESPONDED]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  [LeadStatus.MEETING_SCHEDULED]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [LeadStatus.CONVERTED]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [LeadStatus.COLD]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const emailStatusColors: Record<EmailStatus, string> = {
  [EmailStatus.DRAFT]: 'bg-gray-500/20 text-gray-400',
  [EmailStatus.APPROVED]: 'bg-blue-500/20 text-blue-400',
  [EmailStatus.SENT]: 'bg-emerald-500/20 text-emerald-400',
  [EmailStatus.OPENED]: 'bg-purple-500/20 text-purple-400',
  [EmailStatus.REPLIED]: 'bg-green-500/20 text-green-400',
  [EmailStatus.BOUNCED]: 'bg-red-500/20 text-red-400',
};

export default function LeadDetail({
  lead,
  onUpdate,
  onClose,
  onGenerateEmail,
  onApproveEmail,
  onSendEmail,
  isGenerating,
  isSending,
}: LeadDetailProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<{ email: IEmail; index: number } | null>(null);
  const [notes, setNotes] = useState(lead.notes);
  const [autoFollowUp, setAutoFollowUp] = useState(lead.autoFollowUpEnabled);

  const handleUpdateNotes = async () => {
    try {
      const response = await fetch(`/api/outreach/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await response.json() as { success: boolean; lead?: ILead };
      if (data.success && data.lead) {
        onUpdate(data.lead);
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleToggleAutoFollowUp = async () => {
    try {
      const newValue = !autoFollowUp;
      const response = await fetch(`/api/outreach/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoFollowUpEnabled: newValue }),
      });
      const data = await response.json() as { success: boolean; lead?: ILead };
      if (data.success && data.lead) {
        setAutoFollowUp(newValue);
        onUpdate(data.lead);
      }
    } catch (error) {
      console.error('Failed to toggle auto follow-up:', error);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      const response = await fetch(`/api/outreach/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json() as { success: boolean; lead?: ILead };
      if (data.success && data.lead) {
        onUpdate(data.lead);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100">{lead.companyName}</h2>
          <p className="text-gray-400">{lead.contactName} • {lead.role}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Status and Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={lead.status}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${statusColors[lead.status]} bg-transparent focus:outline-none`}
        >
          {Object.values(LeadStatus).map((status) => (
            <option key={status} value={status} className="bg-gray-800 text-gray-200">
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowGenerateModal(true)}
          disabled={isGenerating}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : '✨ Generate Email'}
        </button>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-500">Email</label>
          <p className="text-gray-200">{lead.email}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Phone</label>
          <p className="text-gray-200">{lead.phone || '-'}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Website</label>
          <p className="text-gray-200">{lead.website || '-'}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Source</label>
          <p className="text-gray-200">{lead.source}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Type</label>
          <p className="text-gray-200 capitalize">{lead.leadType.replace('_', ' ')}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Priority</label>
          <p className="text-gray-200 capitalize">{lead.priority}</p>
        </div>
      </div>

      {/* Context */}
      {lead.context && (lead.context.companyDescription || lead.context.customHook) && (
        <div className="mb-6">
          <label className="text-sm text-gray-500 block mb-2">Context</label>
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
            {lead.context.companyDescription && (
              <p className="text-gray-300 text-sm">{lead.context.companyDescription}</p>
            )}
            {lead.context.customHook && (
              <p className="text-emerald-400 text-sm">Hook: {lead.context.customHook}</p>
            )}
            {lead.context.certifications && lead.context.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lead.context.certifications.map((cert, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Follow-up Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg">
        <div>
          <p className="text-gray-200 font-medium">Auto Follow-up</p>
          <p className="text-sm text-gray-500">Automatically generate follow-up emails</p>
        </div>
        <button
          onClick={handleToggleAutoFollowUp}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoFollowUp ? 'bg-emerald-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoFollowUp ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="text-sm text-gray-500 block mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleUpdateNotes}
          rows={3}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
          placeholder="Add notes about this lead..."
        />
      </div>

      {/* Email History */}
      <div>
        <h3 className="text-sm text-gray-500 mb-3">Email History ({lead.emails.length})</h3>
        {lead.emails.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            No emails yet. Generate your first email to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {lead.emails.map((email, index) => (
              <div
                key={index}
                onClick={() => setSelectedEmail({ email, index })}
                className="bg-gray-900/50 rounded-lg p-4 cursor-pointer hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${emailStatusColors[email.status]}`}>
                    {email.status}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {email.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-200 font-medium text-sm truncate">{email.subject}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Generated: {formatDate(email.generatedAt)}
                  {email.sentAt && ` • Sent: ${formatDate(email.sentAt)}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Email Modal */}
      {showGenerateModal && (
        <GenerateEmailModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={async (type, tone) => {
            await onGenerateEmail(type, tone);
            setShowGenerateModal(false);
          }}
          isGenerating={isGenerating}
          followUpCount={lead.followUpCount}
        />
      )}

      {/* Email Preview Modal */}
      {selectedEmail && (
        <EmailPreview
          email={selectedEmail.email}
          emailIndex={selectedEmail.index}
          onClose={() => setSelectedEmail(null)}
          onApprove={onApproveEmail}
          onSend={onSendEmail}
          isSending={isSending}
        />
      )}
    </div>
  );
}
