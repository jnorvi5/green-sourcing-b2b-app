'use client';

'use client';

/**
 * GenerateEmailModal Component
 * 
 * Modal for selecting email type and tone before generation.
 */
import React, { useState } from 'react';
import { EmailType, EmailTone } from '../../../../types/outreach';

interface GenerateEmailModalProps {
  onClose: () => void;
  onGenerate: (type: EmailType, tone: EmailTone) => Promise<void>;
  isGenerating: boolean;
  followUpCount: number;
}

export default function GenerateEmailModal({
  onClose,
  onGenerate,
  isGenerating,
  followUpCount,
}: GenerateEmailModalProps) {
  // Suggest next email type based on follow-up count
  const suggestedType = (() => {
    switch (followUpCount) {
      case 0:
        return EmailType.INITIAL;
      case 1:
        return EmailType.FOLLOW_UP_1;
      case 2:
        return EmailType.FOLLOW_UP_2;
      default:
        return EmailType.FOLLOW_UP_3;
    }
  })();

  const [emailType, setEmailType] = useState<EmailType>(suggestedType);
  const [tone, setTone] = useState<EmailTone>(EmailTone.FRIENDLY);

  const handleGenerate = () => {
    onGenerate(emailType, tone);
  };

  const emailTypeOptions = [
    {
      value: EmailType.INITIAL,
      label: 'Initial Outreach',
      description: 'First contact with strong hook and value proposition',
    },
    {
      value: EmailType.FOLLOW_UP_1,
      label: 'Follow-up #1',
      description: 'Reference previous email, add new value',
    },
    {
      value: EmailType.FOLLOW_UP_2,
      label: 'Follow-up #2',
      description: 'Lead with value, create mild urgency',
    },
    {
      value: EmailType.FOLLOW_UP_3,
      label: 'Final Follow-up',
      description: 'Break-up style, leave door open',
    },
  ];

  const toneOptions = [
    {
      value: EmailTone.FORMAL,
      label: 'Formal',
      description: 'Professional language for executives',
    },
    {
      value: EmailTone.FRIENDLY,
      label: 'Friendly',
      description: 'Warm but professional',
    },
    {
      value: EmailTone.CASUAL,
      label: 'Casual',
      description: 'Direct and concise',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Generate Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Email Type */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Email Type</label>
            <div className="space-y-2">
              {emailTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    emailType === option.value
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-gray-900/50 hover:bg-gray-900/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailType"
                    value={option.value}
                    checked={emailType === option.value}
                    onChange={(e: any) => setEmailType(e.target.value as EmailType)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-gray-200 font-medium">{option.label}</p>
                    <p className="text-gray-500 text-sm">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    tone === option.value
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-gray-900/50 hover:bg-gray-900/70 text-gray-300'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>✨ Generate</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
