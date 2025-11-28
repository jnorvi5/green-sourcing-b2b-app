// frontend/src/types/filters.ts

export type MaterialType = 
  | 'Insulation'
  | 'Concrete'
  | 'Wood'
  | 'Steel'
  | 'Glass'
  | 'Flooring'
  | 'Cladding';

export type Certification =
  | 'LEED'
  | 'FSC'
  | 'C2C'
  | 'B Corp'
  | 'Energy Star'
  | 'Green Seal';

export type ProductStatus = 'verified' | 'pending' | 'unverified';

export interface FilterState {
  materialTypes: MaterialType[];
  certifications: Certification[];
  carbonRange: [number, number];
  searchQuery: string;
}

export interface FilterActions {
  setMaterialTypes: (types: MaterialType[]) => void;
  toggleMaterialType: (type: MaterialType) => void;
  setCertifications: (certs: Certification[]) => void;
  toggleCertification: (cert: Certification) => void;
  setCarbonRange: (range: [number, number]) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

export const MATERIAL_TYPES: MaterialType[] = [
  'Insulation',
  'Concrete',
  'Wood',
  'Steel',
  'Glass',
  'Flooring',
  'Cladding',
];

export const CERTIFICATIONS: Certification[] = [
  'LEED',
  'FSC',
  'C2C',
  'B Corp',
  'Energy Star',
  'Green Seal',
];

export const DEFAULT_CARBON_RANGE: [number, number] = [0, 200];
