// frontend/src/components/modals/RequestSpecsModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { useNotify } from '../../hooks/useNotify';

interface RequestSpecsFormData {
  projectName: string;
  quantity: string;
  timeline: 'Urgent' | '1-2 weeks' | '1 month' | '3+ months';
  message: string;
}

interface RequestSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  productName: string;
  productId: number;
}

const TIMELINE_OPTIONS: RequestSpecsFormData['timeline'][] = [
  'Urgent',
  '1-2 weeks',
  '1 month',
  '3+ months',
];

const RequestSpecsModal: React.FC<RequestSpecsModalProps> = ({
  isOpen,
  onClose,
  supplierName,
  productName,
  productId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { notifySuccess, notifyError } = useNotify();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<RequestSpecsFormData>({
    projectName: '',
    quantity: '',
    timeline: '1-2 weeks',
    message: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        projectName: '',
        quantity: '',
        timeline: '1-2 weeks',
        message: '',
      });
      setIsSuccess(false);
    }
  }, [isOpen]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call - in production, this would send to backend/email service
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the request (would be sent to backend in production)
      console.log('Specs request submitted:', {
        ...formData,
        productId,
        productName,
        supplierName,
        timestamp: new Date().toISOString(),
      });

      setIsSuccess(true);
      notifySuccess(
        'Request Sent Successfully',
        `Your specifications request has been sent to ${supplierName}.`
      );
    } catch (error) {
      notifyError(
        'Failed to Send Request',
        'Please try again or contact support.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Request Specifications
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            from <span className="font-semibold">{supplierName}</span>
          </p>
          <p className="text-sm text-gray-500">
            Product: {productName}
          </p>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Request Sent!
            </h3>
            <p className="text-gray-600 mb-6">
              {supplierName} will respond to your specifications request within 48 hours.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#4C7D5D] text-white font-semibold rounded-lg 
                hover:bg-[#3d6449] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Project Name */}
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                required
                placeholder="e.g., Downtown Office Building"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                  focus:ring-2 focus:ring-[#4C7D5D] focus:border-transparent"
              />
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity Needed
              </label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                placeholder="e.g., 500 sq ft, 100 units"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                  focus:ring-2 focus:ring-[#4C7D5D] focus:border-transparent"
              />
            </div>

            {/* Timeline */}
            <div>
              <label
                htmlFor="timeline"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Timeline
              </label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                  focus:ring-2 focus:ring-[#4C7D5D] focus:border-transparent bg-white"
              >
                {TIMELINE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message (optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any specific requirements or questions about the product..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                  focus:ring-2 focus:ring-[#4C7D5D] focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#4C7D5D] 
                text-white font-semibold rounded-lg hover:bg-[#3d6449] transition-colors
                disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Request
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestSpecsModal;
