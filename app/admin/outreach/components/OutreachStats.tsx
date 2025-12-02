'use client';

/**
 * OutreachStats Component
 * 
 * Dashboard stats display showing lead and email metrics.
 */
import React from 'react';
import { LeadStatus, LeadType, ILead } from '../../../../types/outreach';

interface OutreachStatsProps {
  leads: ILead[];
}

export default function OutreachStats({ leads }: OutreachStatsProps) {
  // Calculate stats
  const totalLeads = leads.length;
  
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  let emailsSentThisWeek = 0;
  let emailsSentThisMonth = 0;
  let totalResponded = 0;
  let totalConverted = 0;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (const lead of leads) {
    // Count by status
    byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    
    // Count by type
    byType[lead.leadType] = (byType[lead.leadType] || 0) + 1;
    
    // Count responses and conversions
    if (lead.status === LeadStatus.RESPONDED || lead.status === LeadStatus.MEETING_SCHEDULED) {
      totalResponded++;
    }
    if (lead.status === LeadStatus.CONVERTED) {
      totalConverted++;
    }
    
    // Count emails sent
    for (const email of lead.emails) {
      if (email.sentAt) {
        const sentDate = new Date(email.sentAt);
        if (sentDate >= oneWeekAgo) {
          emailsSentThisWeek++;
        }
        if (sentDate >= oneMonthAgo) {
          emailsSentThisMonth++;
        }
      }
    }
  }
  
  const contactedLeads = totalLeads - (byStatus[LeadStatus.NEW] || 0);
  const responseRate = contactedLeads > 0 
    ? Math.round((totalResponded / contactedLeads) * 100) 
    : 0;
  const conversionRate = totalLeads > 0 
    ? Math.round((totalConverted / totalLeads) * 100) 
    : 0;

  const statCards = [
    {
      label: 'Total Leads',
      value: totalLeads,
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      label: 'Emails This Week',
      value: emailsSentThisWeek,
      color: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      label: 'Emails This Month',
      value: emailsSentThisMonth,
      color: 'bg-purple-500/20 text-purple-400',
    },
    {
      label: 'Response Rate',
      value: `${responseRate}%`,
      color: 'bg-amber-500/20 text-amber-400',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      color: 'bg-pink-500/20 text-pink-400',
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-xl p-4 text-center`}
          >
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Status */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">By Status</h3>
          <div className="space-y-2">
            {Object.values(LeadStatus).map((status) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                <span className="text-gray-400 font-medium">{byStatus[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* By Type */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">By Type</h3>
          <div className="space-y-2">
            {Object.values(LeadType).map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{type.replace('_', ' ')}</span>
                <span className="text-gray-400 font-medium">{byType[type] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
