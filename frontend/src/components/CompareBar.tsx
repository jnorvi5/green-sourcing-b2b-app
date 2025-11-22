import React from 'react';
import { useComparisonStore } from '../store/useComparisonStore';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CompareBar = () => {
  const { products, removeProduct, clearComparison } = useComparisonStore();

  if (products.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Compare ({products.length}/3):</span>
            <button 
              onClick={clearComparison}
              className="text-sm text-gray-500 hover:text-red-600 underline"
            >
              Clear all
            </button>
          </div>
          
          <div className="flex gap-4">
            {products.map((product) => (
              <div key={product.id} className="relative group bg-gray-50 rounded-md border border-gray-200 p-1 flex items-center gap-2 pr-2">
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/40'} 
                  alt={product.name} 
                  className="w-10 h-10 object-cover rounded"
                />
                <span className="text-sm font-medium truncate max-w-[100px]">{product.name}</span>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-200 p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <Link
             to="/compare" // Placeholder route for now
             className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
               products.length > 1 
                 ? 'bg-green-600 hover:bg-green-700' 
                 : 'bg-gray-400 cursor-not-allowed'
             }`}
             onClick={(e) => {
               if (products.length < 2) {
                 e.preventDefault();
                 // Optionally show a toast here
               }
             }}
           >
             Compare Now
           </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
