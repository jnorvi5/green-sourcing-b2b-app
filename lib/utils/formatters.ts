/**
 * Utility functions for formatting data
 */

/**
 * Formats material type enum values for display
 * Handles special cases like HVAC and multi-word types
 */
export function formatMaterialType(materialType: string): string {
  const upperCaseAcronyms = ['hvac'];
  
  if (upperCaseAcronyms.includes(materialType.toLowerCase())) {
    return materialType.toUpperCase();
  }
  
  // Replace underscores with spaces and capitalize each word
  return materialType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a date string for display
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Formats a short date string for display
 */
export function formatShortDate(dateString: string | null): string {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Gets the Tailwind CSS classes for RFQ status badge styling
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'responded':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'closed':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    case 'expired':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

/**
 * Calculate hours until deadline
 */
export function getHoursUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil;
}

/**
 * Get deadline urgency level based on hours remaining
 * Returns: 'urgent' (< 24hrs), 'soon' (< 48hrs), 'normal' (> 48hrs)
 */
export function getDeadlineUrgency(deadline: string | null): 'urgent' | 'soon' | 'normal' {
  const hoursUntil = getHoursUntilDeadline(deadline);
  if (hoursUntil === null) return 'normal';
  if (hoursUntil < 0) return 'urgent'; // Expired
  if (hoursUntil < 24) return 'urgent';
  if (hoursUntil < 48) return 'soon';
  return 'normal';
}

/**
 * Get deadline urgency color classes for Tailwind CSS
 */
export function getDeadlineUrgencyColor(deadline: string | null): string {
  const urgency = getDeadlineUrgency(deadline);
  switch (urgency) {
    case 'urgent':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'soon':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'normal':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  }
}

/**
 * Get deadline urgency icon emoji
 */
export function getDeadlineUrgencyIcon(deadline: string | null): string {
  const urgency = getDeadlineUrgency(deadline);
  switch (urgency) {
    case 'urgent':
      return '🔴';
    case 'soon':
      return '🟡';
    case 'normal':
      return '🟢';
  }
}

/**
 * Export quotes data to CSV format
 */
export function exportQuotesToCSV(quotes: Array<{
  supplier?: { company_name?: string };
  quote_amount: number;
  lead_time_days: number;
  status: string;
  message: string | null;
  responded_at: string;
}>): string {
  const headers = [
    'Supplier Name',
    'Quote Amount',
    'Lead Time (Days)',
    'Status',
    'Message',
    'Responded At',
  ];

  const rows = quotes.map((quote) => [
    quote.supplier?.company_name || 'Unknown',
    quote.quote_amount.toFixed(2),
    quote.lead_time_days.toString(),
    quote.status,
    quote.message || '',
    new Date(quote.responded_at).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}
