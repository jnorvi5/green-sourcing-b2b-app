import React from 'react';
import { Skeleton } from './ui/skeleton';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      {/* Image Placeholder */}
      <div className="relative">
        <Skeleton className="w-full h-48" />
      </div>

      <div className="p-4 flex-grow flex flex-col">
        {/* Supplier Name */}
        <Skeleton className="h-3 w-1/3 mb-2" />
        
        {/* Product Name */}
        <Skeleton className="h-6 w-3/4 mb-4" />

        <div className="mt-4 flex-grow">
          {/* Sustainability Header */}
          <Skeleton className="h-4 w-1/4 mb-2" />
          
          {/* Metrics */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        <div className="mt-4">
          {/* Certifications Header */}
          <Skeleton className="h-4 w-1/4 mb-2" />
          
          {/* Certification Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-0">
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
