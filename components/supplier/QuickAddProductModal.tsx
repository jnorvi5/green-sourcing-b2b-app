'use client';

import { useState } from 'react';
import { FiX, FiPlus, FiUpload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierId: string;
}

export function QuickAddProductModal({
  isOpen,
  onClose,
  onSuccess,
  supplierId,
}: QuickAddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    material_type: '',
    description: '',
    certifications: [] as string[],
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const certificationOptions = [
    'FSC Certified',
    'LEED',
    'Cradle to Cradle',
    'Green Guard',
    'Energy Star',
    'ISO 14001',
  ];

  const materialTypes = [
    'Insulation',
    'Flooring',
    'Structural Materials',
    'Finishes',
    'Roofing',
    'Windows & Doors',
    'Concrete',
    'Steel',
    'Wood',
    'Other',
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const toggleCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.material_type) {
        setError('Product name and material type are required');
        setLoading(false);
        return;
      }

      // Upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${supplierId}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('product-images')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Insert product
      const { error: insertError } = await supabase.from('products').insert({
        supplier_id: supplierId,
        name: formData.name,
        material_type: formData.material_type,
        description: formData.description || null,
        certifications: formData.certifications.length > 0 ? formData.certifications : null,
        images: imageUrl ? [imageUrl] : null,
        verified: false,
      });

      if (insertError) {
        throw new Error(`Failed to create product: ${insertError.message}`);
      }

      // Reset form
      setFormData({
        name: '',
        material_type: '',
        description: '',
        certifications: [],
      });
      setSelectedImage(null);
      setImagePreview(null);

      // Call success callback
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="modal-title" className="text-2xl font-bold text-foreground">
              Quick Add Product
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0"
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-foreground mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Recycled Steel Beams"
                required
                aria-required="true"
              />
            </div>

            {/* Material Type */}
            <div>
              <label htmlFor="material-type" className="block text-sm font-medium text-foreground mb-2">
                Material Type <span className="text-red-500">*</span>
              </label>
              <select
                id="material-type"
                value={formData.material_type}
                onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
                aria-required="true"
              >
                <option value="">Select material type...</option>
                {materialTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
                placeholder="Brief description of your product..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Product Image
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-teal-500 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <FiUpload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Quick Certifications
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {certificationOptions.map((cert) => (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCertification(cert)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      formData.certifications.includes(cert)
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : 'bg-background border-border text-muted-foreground hover:border-teal-500/50'
                    }`}
                    aria-pressed={formData.certifications.includes(cert)}
                  >
                    {formData.certifications.includes(cert) && '✓ '}
                    {cert}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.material_type}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
              >
                {loading ? 'Adding Product...' : 'Add Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
