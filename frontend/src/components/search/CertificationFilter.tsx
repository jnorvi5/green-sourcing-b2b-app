// frontend/src/components/search/CertificationFilter.tsx
import React from 'react';
import type { Certification } from '../../types/filters';
import { CERTIFICATIONS } from '../../types/filters';

interface CertificationFilterProps {
  selected: Certification[];
  onChange: (cert: Certification) => void;
}

// Display names for certifications
const certificationLabels: Record<Certification, string> = {
  'LEED': 'LEED',
  'FSC': 'FSC',
  'C2C': 'Cradle to Cradle (C2C)',
  'B Corp': 'B Corp',
  'Energy Star': 'Energy Star',
  'Green Seal': 'Green Seal',
};

const CertificationFilter: React.FC<CertificationFilterProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      {CERTIFICATIONS.map((cert) => (
        <label
          key={cert}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={selected.includes(cert)}
            onChange={() => onChange(cert)}
            className="w-4 h-4 rounded border-gray-300 text-[#4C7D5D] 
              focus:ring-[#4C7D5D] focus:ring-offset-0 cursor-pointer
              transition-colors"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            {certificationLabels[cert]}
          </span>
        </label>
      ))}
    </div>
  );
};

export default CertificationFilter;
