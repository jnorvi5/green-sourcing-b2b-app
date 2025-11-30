'use client';

/**
 * LeadList Component
 * 
 * Displays leads in a table with filtering and search.
 */
import React from 'react';
import { ILead, LeadStatus, LeadType, LeadPriority, EmailStatus } from '../../../../types/outreach';

interface LeadListProps {
  leads: ILead[];
  selectedLead: ILead | null;
  onSelectLead: (lead: ILead) => void;
  onStatusFilter: (status: LeadStatus | '') => void;
  onTypeFilter: (type: LeadType | '') => void;
  onSearch: (query: string) => void;
  statusFilter: LeadStatus | '';
  typeFilter: LeadType | '';
  searchQuery: string;
}

const statusColors: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'bg-blue-500/20 text-blue-400',
  [LeadStatus.CONTACTED]: 'bg-amber-500/20 text-amber-400',
  [LeadStatus.RESPONDED]: 'bg-emerald-500/20 text-emerald-400',
  [LeadStatus.MEETING_SCHEDULED]: 'bg-purple-500/20 text-purple-400',
  [LeadStatus.CONVERTED]: 'bg-green-500/20 text-green-400',
  [LeadStatus.COLD]: 'bg-gray-500/20 text-gray-400',
};

const priorityColors: Record<LeadPriority, string> = {
  [LeadPriority.HIGH]: 'text-red-400',
  [LeadPriority.MEDIUM]: 'text-amber-400',
  [LeadPriority.LOW]: 'text-gray-400',
};

export default function LeadList({
  leads,
  selectedLead,
  onSelectLead,
  onStatusFilter,
  onTypeFilter,
  onSearch,
  statusFilter,
  typeFilter,
  searchQuery,
}: LeadListProps) {
  const getEmailStats = (lead: ILead) => {
    const total = lead.emails.length;
    const sent = lead.emails.filter(e => e.status === EmailStatus.SENT).length;
    const draft = lead.emails.filter(e => e.status === EmailStatus.DRAFT).length;
    return { total, sent, draft };
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e: any) => onSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e: any) => onStatusFilter(e.target.value as LeadStatus | '')}
          className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          {Object.values(LeadStatus).map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </option>
          ))}
        </select>
        
        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e: any) => onTypeFilter(e.target.value as LeadType | '')}
          className="bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Types</option>
          {Object.values(LeadType).map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Lead Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
              <th className="pb-3 pr-4">Company</th>
              <th className="pb-3 pr-4">Contact</th>
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Priority</th>
              <th className="pb-3">Emails</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No leads found. Create your first lead to get started.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const emailStats = getEmailStats(lead);
                const isSelected = selectedLead?._id === lead._id;
                
                return (
                  <tr
                    key={lead._id}
                    onClick={() => onSelectLead(lead)}
                    className={`border-b border-gray-700/50 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-emerald-500/10' 
                        : 'hover:bg-gray-700/30'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-200">{lead.companyName}</div>
                      <div className="text-sm text-gray-500">{lead.website || '-'}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-gray-300">{lead.contactName}</div>
                      <div className="text-sm text-gray-500">{lead.role}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="capitalize text-gray-300">
                        {lead.leadType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`font-medium ${priorityColors[lead.priority]}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-400">{emailStats.sent} sent</span>
                        {emailStats.draft > 0 && (
                          <span className="text-amber-400">{emailStats.draft} draft</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
