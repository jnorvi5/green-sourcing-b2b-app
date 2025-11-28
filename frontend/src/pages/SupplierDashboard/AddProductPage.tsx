import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/SupplierDashboard/Sidebar';
import { createProduct, type MongoProduct } from '../../lib/products-api';
import { uploadFile, validateFile } from '../../lib/upload-api';

const MATERIAL_TYPES = ['Insulation', 'Flooring', 'Roofing', 'Lumber', 'Concrete', 'Paint & Coatings', 'Structural', 'Envelope', 'Finishes'];
const APPLICATIONS = ['Residential', 'Commercial', 'Both'];
const CERTIFICATION_OPTIONS = [
  'LEED', 'FSC', 'B Corp', 'Cradle to Cradle', 'Green Seal',
  'Energy Star', 'EPEAT', 'BREEAM', 'Living Building Challenge', 'Declare Label'
];

export default function AddProductPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    materialType: '',
    application: [] as string[],
    recycledContent: 0,
    carbonFootprint: 0,
    vocLevel: '',
    certifications: [] as string[],
    technicalSpecs: '',
    price: 0,
    unitOfMeasure: 'unit',
    minOrderQuantity: 1,
    leadTimeDays: 7,
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      // Validate file
      const validation = validateFile(file, { maxSize: 5 * 1024 * 1024 });
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      // Upload to S3
      const url = await uploadFile(file, 'products');
      if (url) {
        newImages.push(url);
      } else {
        setError('Failed to upload image');
      }
    }

    setImages([...images, ...newImages]);
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Get supplier ID from auth context (placeholder for now)
    const supplierId = localStorage.getItem('greenchainz-user-id') || 'supplier-demo';

    // Build product data for MongoDB API
    const productData: Partial<MongoProduct> = {
      title: formData.name,
      description: formData.description,
      category: formData.materialType,
      price: formData.price,
      currency: 'USD',
      supplierId,
      images: images,
      status: 'draft', // Start as draft, admin can approve
      minOrderQuantity: formData.minOrderQuantity,
      unitOfMeasure: formData.unitOfMeasure,
      leadTimeDays: formData.leadTimeDays,
      tags: formData.application,
      greenData: {
        recycledContent: formData.recycledContent,
        carbonFootprint: formData.carbonFootprint,
        certifications: formData.certifications,
      },
    };

    const response = await createProduct(productData);

    if (response.success) {
      alert('Product created successfully!');
      navigate('/dashboard/supplier/products');
    } else {
      setError(response.error || 'Failed to create product');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Add New Product</h1>

        <form onSubmit={handleSubmit} className="max-w-3xl bg-background border border-border rounded-lg p-8 space-y-6">

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Warmcel Cellulose Insulation"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe your product, its benefits, and ideal use cases..."
            />
          </div>

          {/* Material Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Material Type *</label>
            <select
              required
              value={formData.materialType}
              onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select material type</option>
              {MATERIAL_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Application */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Application *</label>
            <div className="space-y-2">
              {APPLICATIONS.map(app => (
                <label key={app} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={app}
                    onChange={(e) => {
                      const newApplications = e.target.checked
                        ? [...formData.application, app]
                        : formData.application.filter(a => a !== app);
                      setFormData({ ...formData, application: newApplications });
                    }}
                    className="w-4 h-4 text-primary border-border rounded"
                  />
                  <span className="text-sm text-foreground">{app}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recycled Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Recycled Content (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.recycledContent}
              onChange={(e) => setFormData({ ...formData, recycledContent: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Carbon Footprint */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Carbon Footprint (kg CO2e per unit)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.carbonFootprint}
              onChange={(e) => setFormData({ ...formData, carbonFootprint: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., 2.5"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price (USD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 150.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Unit of Measure</label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="unit">Per Unit</option>
                <option value="sqft">Per Sq Ft</option>
                <option value="sqm">Per Sq M</option>
                <option value="lb">Per Lb</option>
                <option value="kg">Per Kg</option>
                <option value="ton">Per Ton</option>
                <option value="pallet">Per Pallet</option>
              </select>
            </div>
          </div>

          {/* Min Order & Lead Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Minimum Order Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.minOrderQuantity}
                onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Lead Time (days)</label>
              <input
                type="number"
                min="0"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* VOC Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">VOC Level</label>
            <select
              value={formData.vocLevel}
              onChange={(e) => setFormData({ ...formData, vocLevel: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select VOC level</option>
              <option value="Zero">Zero</option>
              <option value="Low">Low</option>
              <option value="Standard">Standard</option>
            </select>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Certifications</label>
            <div className="grid grid-cols-2 gap-2">
              {CERTIFICATION_OPTIONS.map(cert => (
                <label key={cert} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={cert}
                    checked={formData.certifications.includes(cert)}
                    onChange={(e) => {
                      const newCertifications = e.target.checked
                        ? [...formData.certifications, cert]
                        : formData.certifications.filter(c => c !== cert);
                      setFormData({ ...formData, certifications: newCertifications });
                    }}
                    className="w-4 h-4 text-primary border-border rounded"
                  />
                  <span className="text-sm text-foreground">{cert}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Technical Specs */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Technical Specifications</label>
            <textarea
              value={formData.technicalSpecs}
              onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="R-Value: 3.7&#10;Fire Rating: Class A&#10;Density: 3.5 lb/ft³"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Product Images</label>

            {/* Existing Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : '+ Add Images'}
              </label>
              <span className="text-sm text-muted-foreground">
                JPG, PNG, or WebP. Max 5MB each.
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Publish Product'}
          </div>

        </form>

      </main>
    </div>
  );
}
