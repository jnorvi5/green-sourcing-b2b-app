'use client';

'use client';

/**
 * EmailPreview Component
 * 
 * Modal for viewing, editing, and approving emails.
 */
import React, { useState } from 'react';
import { IEmail, EmailStatus } from '../../../../types/outreach';

interface EmailPreviewProps {
  email: IEmail;
  emailIndex: number;
  onClose: () => void;
  onApprove: (emailIndex: number, editedSubject?: string, editedBody?: string) => Promise<void>;
  onSend: (emailIndex: number) => Promise<void>;
  isSending: boolean;
}

export default function EmailPreview({
  email,
  emailIndex,
  onClose,
  onApprove,
  onSend,
  isSending,
}: EmailPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(email.subject);
  const [editedBody, setEditedBody] = useState(email.body);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('text');
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(
        emailIndex,
        editedSubject !== email.subject ? editedSubject : undefined,
        editedBody !== email.body ? editedBody : undefined
      );
      setIsEditing(false);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSend = async () => {
    await onSend(emailIndex);
  };

  const canApprove = email.status === EmailStatus.DRAFT;
  const canSend = email.status === EmailStatus.APPROVED;
  const isSent = email.status === EmailStatus.SENT || email.status === EmailStatus.OPENED || email.status === EmailStatus.REPLIED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Email Preview</h2>
            <p className="text-sm text-gray-400 capitalize">{email.type.replace('_', ' ')}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'text' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'html' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                HTML
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Subject */}
          <div className="mb-4">
            <label className="text-sm text-gray-500 block mb-1">Subject</label>
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedSubject(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <p className="text-gray-200 font-medium">{email.subject}</p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="text-sm text-gray-500 block mb-1">Body</label>
            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedBody(e.target.value)}
                rows={15}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 resize-none font-mono text-sm"
              />
            ) : viewMode === 'text' ? (
              <div className="bg-gray-900/50 rounded-lg p-4 whitespace-pre-wrap text-gray-200 text-sm font-mono">
                {email.body}
              </div>
            ) : (
              <div 
                className="bg-white rounded-lg p-4 overflow-auto"
                dangerouslySetInnerHTML={{ __html: email.htmlBody || email.body }}
              />
            )}
          </div>

          {/* Metadata */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status: </span>
              <span className="text-gray-300 capitalize">{email.status}</span>
            </div>
            <div>
              <span className="text-gray-500">Generated: </span>
              <span className="text-gray-300">
                {new Date(email.generatedAt).toLocaleString()}
              </span>
            </div>
            {email.sentAt && (
              <div>
                <span className="text-gray-500">Sent: </span>
                <span className="text-gray-300">
                  {new Date(email.sentAt).toLocaleString()}
                </span>
              </div>
            )}
            {email.messageId && (
              <div>
                <span className="text-gray-500">Message ID: </span>
                <span className="text-gray-300 text-xs font-mono">{email.messageId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div>
            {canApprove && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
              >
                ✏️ Edit
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedSubject(email.subject);
                  setEditedBody(email.body);
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isApproving ? 'Approving...' : '✓ Approve'}
              </button>
            )}
            
            {canSend && (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSending ? 'Sending...' : '📤 Send'}
              </button>
            )}

            {isSent && (
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                ✓ Sent
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
