export interface MasterFormatSupplier {
  name: string;
  masterFormatCode: string;
  website: string;
  source: 'gap_analysis';
  verified: boolean;
  notes?: string;
}

export const GAP_ANALYSIS_SUPPLIERS: MasterFormatSupplier[] = [
  // Division 04 - Masonry
  {
    name: 'General Shale',
    masterFormatCode: '04',
    website: 'https://generalshale.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'America\'s largest producer of clay brick and sustainable building materials.'
  },
  {
    name: 'Triangle Brick',
    masterFormatCode: '04',
    website: 'https://www.trianglebrick.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Leading brick manufacturer since 1959.'
  },
  {
    name: 'Coronado Stone Products',
    masterFormatCode: '04',
    website: 'https://coronado.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Manufactures architectural stone veneer and thin brick.'
  },
  {
    name: 'U.S. Stone Industries',
    masterFormatCode: '04',
    website: 'https://usstoneindustries.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Natural Kansas limestone.'
  },

  // Division 09 - Finishes (Paints & Coatings)
  {
    name: 'Sherwin-Williams',
    masterFormatCode: '09',
    website: 'https://industrial.sherwin-williams.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Powdura ECO powder coatings and other sustainable solutions.'
  },
  {
    name: 'PPG Paints',
    masterFormatCode: '09',
    website: 'https://www.ppgpaints.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Zero- or low-VOC products, LEED compliant.'
  },
  {
    name: 'Graphenstone',
    masterFormatCode: '09',
    website: 'https://graphenstone.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Ecological solutions with graphene technology.'
  },

  // Division 09 - Finishes (Ceilings)
  {
    name: 'Armstrong World Industries',
    masterFormatCode: '09',
    website: 'https://www.armstrongceilings.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Sustain portfolio, recyclable mineral fiber.'
  },
  {
    name: 'Rockfon',
    masterFormatCode: '09',
    website: 'https://www.rockfon.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Stone wool ceiling tiles.'
  },
  {
    name: 'USG (United States Gypsum)',
    masterFormatCode: '09',
    website: 'https://www.usg.com',
    source: 'gap_analysis',
    verified: true,
    notes: 'Ceiling panels and systems.'
  }
];

export function getValidatedSuppliers(): MasterFormatSupplier[] {
  return GAP_ANALYSIS_SUPPLIERS;
}
