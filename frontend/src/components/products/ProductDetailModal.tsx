// frontend/src/components/products/ProductDetailModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Clock, Package } from 'lucide-react';
import type { MockProduct } from '../../mocks/productData';
import CarbonIndicator from './CarbonIndicator';
import VerifiedBadge from './VerifiedBadge';

interface ProductDetailModalProps {
  product: MockProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestSpecs: (product: MockProduct) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onRequestSpecs,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  const carbonValue = product.embodiedCarbon ?? product.epd?.gwp ?? 0;
  const images = product.imageUrl 
    ? [product.imageUrl] 
    : ['https://via.placeholder.com/800x600.png?text=No+Image'];

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            {product.status === 'verified' && <VerifiedBadge size="sm" />}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              {/* Main image */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail strip - show if multiple images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 
                        ${idx === currentImageIndex ? 'border-[#4C7D5D]' : 'border-gray-200'}`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Supplier info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Supplier</p>
                <p className="text-lg font-semibold text-gray-900">{product.supplier}</p>
                {product.availability && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>{product.availability}</span>
                  </div>
                )}
                {product.leadTime && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Lead time: {product.leadTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Sustainability Metrics */}
              <div className="p-4 bg-gradient-to-br from-[#4C7D5D]/5 to-[#7FA884]/10 rounded-lg border border-[#4C7D5D]/20">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sustainability Metrics</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Embodied Carbon */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Embodied Carbon (GWP A1-A3)</p>
                    <CarbonIndicator value={carbonValue} size="md" />
                  </div>

                  {/* Total GWP if available */}
                  {product.epd?.gwpTotal && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total GWP</p>
                      <p className="text-lg font-bold text-gray-900">{product.epd.gwpTotal} kgCO₂e</p>
                    </div>
                  )}

                  {/* Recycled Content */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Recycled Content</p>
                    <p className="text-lg font-bold text-[#4C7D5D]">{product.recycledContent}%</p>
                  </div>

                  {/* VOC Emissions */}
                  {product.vocEmissions && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">VOC Emissions</p>
                      <p className="text-lg font-bold text-gray-900">{product.vocEmissions}</p>
                    </div>
                  )}

                  {/* R-Value */}
                  {product.rValue && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">R-Value</p>
                      <p className="text-lg font-bold text-gray-900">{product.rValue} /inch</p>
                    </div>
                  )}

                  {/* Thermal Conductivity */}
                  {product.thermalConductivity && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Thermal Conductivity</p>
                      <p className="text-lg font-bold text-gray-900">{product.thermalConductivity} W/(m·K)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LEED Credits */}
              {product.leedCredits && product.leedCredits.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">LEED Credits Applicable</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.leedCredits.map((credit, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
                      >
                        {credit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {product.certifications && product.certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Download EPD Button */}
            {product.epdPdfUrl ? (
              <a
                href={product.epdPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 
                  text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download EPD
              </a>
            ) : (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 
                  text-gray-400 font-semibold rounded-lg cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                EPD Not Available
              </button>
            )}

            {/* Request Specs Button */}
            <button
              onClick={() => onRequestSpecs(product)}
              className="flex-1 px-6 py-3 bg-[#4C7D5D] text-white font-semibold rounded-lg 
                hover:bg-[#3d6449] transition-colors"
            >
              Request Specs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
