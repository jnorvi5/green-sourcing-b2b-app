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
