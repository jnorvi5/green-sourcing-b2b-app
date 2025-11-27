// frontend/src/components/search/MaterialTypeFilter.tsx
import React from 'react';
import type { MaterialType } from '../../types/filters';
import { MATERIAL_TYPES } from '../../types/filters';

interface MaterialTypeFilterProps {
  selected: MaterialType[];
  onChange: (type: MaterialType) => void;
}

const MaterialTypeFilter: React.FC<MaterialTypeFilterProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      {MATERIAL_TYPES.map((type) => (
        <label
          key={type}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={selected.includes(type)}
            onChange={() => onChange(type)}
            className="w-4 h-4 rounded border-gray-300 text-[#4C7D5D] 
              focus:ring-[#4C7D5D] focus:ring-offset-0 cursor-pointer
              transition-colors"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            {type}
          </span>
        </label>
      ))}
    </div>
  );
};

export default MaterialTypeFilter;
