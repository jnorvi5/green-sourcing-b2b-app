// frontend/src/components/search/CarbonRangeSlider.tsx
import React, { useState, useEffect } from 'react';

interface CarbonRangeSliderProps {
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

const CarbonRangeSlider: React.FC<CarbonRangeSliderProps> = ({
  min = 0,
  max = 200,
  value,
  onChange,
}) => {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localMax - 1);
    setLocalMin(newMin);
    onChange([newMin, localMax]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin + 1);
    setLocalMax(newMax);
    onChange([localMin, newMax]);
  };

  // Calculate position percentages for the visual indicator
  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{localMin}</span> kgCO₂e
        </span>
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{localMax}</span> kgCO₂e
        </span>
      </div>

      {/* Visual range indicator */}
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-2 rounded-full"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
            background: 'linear-gradient(to right, #4C7D5D, #7FA884)',
          }}
        />
      </div>

      {/* Dual range sliders */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#4C7D5D] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#4C7D5D] [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#4C7D5D] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#4C7D5D] [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
        />
      </div>

      {/* Color legend */}
      <div className="flex justify-between text-xs text-gray-500 pt-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Low (0-30)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          Medium (31-100)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          High (&gt;100)
        </span>
      </div>
    </div>
  );
};

export default CarbonRangeSlider;
