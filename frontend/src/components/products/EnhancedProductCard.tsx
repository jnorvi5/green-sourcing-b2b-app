// frontend/src/components/products/EnhancedProductCard.tsx
import React, { useState } from 'react';
import type { MockProduct } from '../../mocks/productData';
import { useProjects } from '../../context/ProjectContext';
import CreateProjectModal from '../Projects/CreateProjectModal';
import { useComparisonStore } from '../../store/useComparisonStore';
import CarbonIndicator from './CarbonIndicator';
import VerifiedBadge from './VerifiedBadge';

interface EnhancedProductCardProps {
  product: MockProduct;
  onClick?: () => void;
}

const CertificationIcon: React.FC<{ name: string }> = ({ name }) => (
  <div className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
    {name}
  </div>
);

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({ 
  product, 
  onClick 
}) => {
  const {
    name,
    imageUrl,
    recycledContent,
    certifications,
    epd,
    supplier,
    status,
    embodiedCarbon,
  } = product;

  const { projects, addProductToProject } = useProjects();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { products: comparisonProducts, addProduct, removeProduct } = useComparisonStore();
  const isSelected = comparisonProducts.some(p => p.id === product.id);

  const handleAddToProject = (projectId: number) => {
    addProductToProject(projectId, product.id);
    setShowProjectMenu(false);
  };

  const handleCompareToggle = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isSelected) {
      removeProduct(product.id);
    } else {
      if (comparisonProducts.length >= 3) {
        alert('You can only compare up to 3 products.');
        return;
      }
      addProduct(product);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const displayImage = imageUrl || 'https://via.placeholder.com/400x300.png?text=No+Image';
  const carbonValue = embodiedCarbon ?? epd?.gwp ?? 0;

  return (
    <>
      <div 
        className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden flex flex-col h-full 
          hover:shadow-lg hover:border-[#4C7D5D]/30 transition-all duration-200 cursor-pointer group"
        onClick={handleCardClick}
      >
        {/* Image container with 4:3 aspect ratio */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={displayImage}
            alt={name}
            loading="lazy"
          />
          
          {/* Verified badge */}
          {status === 'verified' && (
            <div className="absolute top-2 left-2">
              <VerifiedBadge size="sm" />
            </div>
          )}

          {/* Compare checkbox */}
          <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
            <label className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm cursor-pointer hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCompareToggle}
                className="rounded border-gray-300 text-[#4C7D5D] focus:ring-[#4C7D5D]"
              />
              <span className="text-xs font-medium text-gray-700">Compare</span>
            </label>
          </div>
        </div>

        <div className="p-4 flex-grow flex flex-col">
          {/* Supplier name */}
          <p className="text-sm text-gray-500 uppercase tracking-wide">{supplier}</p>
          
          {/* Product name */}
          <h2 className="text-lg font-bold text-gray-800 truncate mt-1" title={name}>
            {name}
          </h2>

          {/* Carbon indicator - prominent display */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Embodied Carbon</p>
            <CarbonIndicator value={carbonValue} size="md" />
          </div>

          {/* Sustainability metrics */}
          <div className="mt-4 flex-grow">
            <div className="text-xs text-gray-500 space-y-1">
              {recycledContent !== undefined && recycledContent > 0 && (
                <p>
                  <span className="font-bold text-gray-700">{recycledContent}%</span> Recycled Content
                </p>
              )}
            </div>
          </div>

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {certifications.slice(0, 3).map(cert => (
                  <CertificationIcon key={cert} name={cert} />
                ))}
                {certifications.length > 3 && (
                  <span className="text-xs text-gray-500 self-center">
                    +{certifications.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 pt-0 space-y-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProjectMenu(!showProjectMenu);
            }}
            className="w-full px-4 py-2 border-2 border-[#4C7D5D] text-[#4C7D5D] font-semibold rounded-lg 
              hover:bg-[#4C7D5D]/5 transition-colors"
          >
            + Add to Project
          </button>

          {showProjectMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">Add to project:</p>
              </div>

              <div className="max-h-40 overflow-y-auto">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleAddToProject(project.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="text-lg">📁</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.productIds.length} products</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowProjectMenu(false);
                  setShowCreateModal(true);
                }}
                className="w-full text-left px-4 py-2 border-t border-gray-200 hover:bg-gray-50 
                  flex items-center gap-3 text-[#4C7D5D] font-medium"
              >
                <span className="text-lg">+</span>
                Create New Project
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
};

export default EnhancedProductCard;
