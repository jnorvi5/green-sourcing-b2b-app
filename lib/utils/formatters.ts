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
