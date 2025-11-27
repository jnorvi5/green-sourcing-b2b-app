/**
 * Supplier Profile Edit Page
 *
 * Allows suppliers to edit their company profile, certifications, and settings
 */
import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Globe,
  Phone,
  Mail,
  Upload,
  Plus,
  X,
  Check,
  Camera,
  Leaf,
  Award,
  FileText,
  Users,
  Factory,
  Clock,
  DollarSign,
  Truck,
  ShieldCheck,
  AlertCircle,
  Save,
} from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  validUntil: string;
  documentUrl?: string;
}

interface SupplierProfile {
  companyName: string;
  description: string;
  tagline: string;
  logo?: string;
  coverImage?: string;
  website: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  founded: string;
  employees: string;
  annualRevenue: string;
  minimumOrder: string;
  leadTime: string;
  productCategories: string[];
  certifications: Certification[];
  sustainabilityCommitments: string[];
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

const initialProfile: SupplierProfile = {
  companyName: 'EcoMaterials Co',
  description:
    'Leading manufacturer of sustainable packaging and materials. We specialize in eco-friendly alternatives to traditional packaging, serving businesses committed to reducing their environmental impact.',
  tagline: 'Sustainable solutions for a greener tomorrow',
  logo: '',
  coverImage: '',
  website: 'https://ecomaterials.example.com',
  phone: '+1 (555) 123-4567',
  email: 'contact@ecomaterials.example.com',
  address: {
    street: '123 Green Way',
    city: 'Portland',
    state: 'Oregon',
    zipCode: '97201',
    country: 'United States',
  },
  founded: '2015',
  employees: '50-100',
  annualRevenue: '$5M - $10M',
  minimumOrder: '$500',
  leadTime: '7-14 days',
  productCategories: ['Packaging', 'Recycled Materials', 'Biodegradable Products'],
  certifications: [
    {
      id: '1',
      name: 'ISO 14001',
      issuer: 'ISO',
      validUntil: '2025-12-31',
    },
    {
      id: '2',
      name: 'FSC Certified',
      issuer: 'Forest Stewardship Council',
      validUntil: '2024-06-30',
    },
  ],
  sustainabilityCommitments: [
    'Carbon Neutral by 2025',
    '100% Renewable Energy',
    'Zero Waste to Landfill',
    'Sustainable Supply Chain',
  ],
  socialMedia: {
    linkedin: 'https://linkedin.com/company/ecomaterials',
    twitter: 'https://twitter.com/ecomaterials',
  },
};

const productCategoryOptions = [
  'Packaging',
  'Recycled Materials',
  'Biodegradable Products',
  'Hemp & Natural Fibers',
  'Bamboo Products',
  'Recycled Plastics',
  'Sustainable Textiles',
  'Eco-Chemicals',
  'Green Building Materials',
  'Organic Products',
];

const employeeRanges = [
  '1-10',
  '11-50',
  '50-100',
  '100-500',
  '500-1000',
  '1000+',
];

const revenueRanges = [
  'Under $1M',
  '$1M - $5M',
  '$5M - $10M',
  '$10M - $50M',
  '$50M - $100M',
  'Over $100M',
];

export default function SupplierProfileEdit() {
  const [profile, setProfile] = useState<SupplierProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'certifications' | 'sustainability'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newCommitment, setNewCommitment] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);
  const [newCert, setNewCert] = useState<Partial<Certification>>({});

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleAddCategory = () => {
    if (newCategory && !profile.productCategories.includes(newCategory)) {
      setProfile((prev) => ({
        ...prev,
        productCategories: [...prev.productCategories, newCategory],
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setProfile((prev) => ({
      ...prev,
      productCategories: prev.productCategories.filter((c) => c !== category),
    }));
  };

  const handleAddCommitment = () => {
    if (newCommitment && !profile.sustainabilityCommitments.includes(newCommitment)) {
      setProfile((prev) => ({
        ...prev,
        sustainabilityCommitments: [...prev.sustainabilityCommitments, newCommitment],
      }));
      setNewCommitment('');
    }
  };

  const handleRemoveCommitment = (commitment: string) => {
    setProfile((prev) => ({
      ...prev,
      sustainabilityCommitments: prev.sustainabilityCommitments.filter(
        (c) => c !== commitment
      ),
    }));
  };

  const handleAddCertification = () => {
    if (newCert.name && newCert.issuer && newCert.validUntil) {
      const cert: Certification = {
        id: Date.now().toString(),
        name: newCert.name,
        issuer: newCert.issuer,
        validUntil: newCert.validUntil,
      };
      setProfile((prev) => ({
        ...prev,
        certifications: [...prev.certifications, cert],
      }));
      setNewCert({});
      setShowCertModal(false);
    }
  };

  const handleRemoveCertification = (certId: string) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== certId),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <Building className="w-4 h-4" /> },
    { id: 'details', label: 'Business Details', icon: <Factory className="w-4 h-4" /> },
    { id: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" /> },
    { id: 'sustainability', label: 'Sustainability', icon: <Leaf className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Company Profile</h1>
            <p className="text-gray-600">Update your company information and certifications</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span>Saved successfully!</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-green-400 to-green-600 relative">
                <button className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white">
                  <Camera className="w-4 h-4" />
                  Change Cover
                </button>
              </div>
              <div className="p-6 -mt-12 relative">
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 bg-white border-4 border-white rounded-xl shadow-lg flex items-center justify-center relative">
                    <Building className="w-12 h-12 text-gray-400" />
                    <button className="absolute -bottom-1 -right-1 p-1.5 bg-green-600 text-white rounded-full hover:bg-green-700">
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="pb-2">
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="text-2xl font-bold text-gray-900 border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-green-500 focus:ring-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={profile.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="Company tagline"
                      className="text-gray-500 border-0 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:ring-0 bg-transparent w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-3">Company Description</h3>
              <textarea
                value={profile.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Describe your company..."
              />
              <p className="text-sm text-gray-500 mt-2">
                {profile.description.length}/500 characters
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={profile.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={profile.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={profile.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={profile.address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={profile.address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Founded Year
                  </label>
                  <input
                    type="text"
                    value={profile.founded}
                    onChange={(e) => handleInputChange('founded', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users className="w-4 h-4 inline mr-1" />
                    Number of Employees
                  </label>
                  <select
                    value={profile.employees}
                    onChange={(e) => handleInputChange('employees', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {employeeRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Annual Revenue
                  </label>
                  <select
                    value={profile.annualRevenue}
                    onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {revenueRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Value
                  </label>
                  <input
                    type="text"
                    value={profile.minimumOrder}
                    onChange={(e) => handleInputChange('minimumOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Truck className="w-4 h-4 inline mr-1" />
                    Typical Lead Time
                  </label>
                  <input
                    type="text"
                    value={profile.leadTime}
                    onChange={(e) => handleInputChange('leadTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Product Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Product Categories</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.productCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full"
                  >
                    {category}
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="p-0.5 hover:bg-green-200 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a category</option>
                  {productCategoryOptions
                    .filter((c) => !profile.productCategories.includes(c))
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Certifications & Compliance</h3>
                <button
                  onClick={() => setShowCertModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Certification
                </button>
              </div>

              <div className="space-y-3">
                {profile.certifications.map((cert) => {
                  const isExpiringSoon =
                    new Date(cert.validUntil) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{cert.name}</p>
                          <p className="text-sm text-gray-500">Issued by {cert.issuer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`text-sm ${
                              isExpiringSoon ? 'text-orange-600' : 'text-gray-500'
                            }`}
                          >
                            {isExpiringSoon && (
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                            )}
                            Valid until {cert.validUntil}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCertification(cert.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {profile.certifications.length === 0 && (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No certifications added yet</p>
                    <button
                      onClick={() => setShowCertModal(true)}
                      className="mt-2 text-green-600 hover:text-green-700"
                    >
                      Add your first certification
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Certification Documents</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  Drag and drop certification documents here
                </p>
                <p className="text-sm text-gray-500 mb-4">PDF, PNG, JPG up to 10MB</p>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Browse Files
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sustainability Tab */}
        {activeTab === 'sustainability' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Sustainability Commitments</h3>
              <div className="space-y-3 mb-4">
                {profile.sustainabilityCommitments.map((commitment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">{commitment}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCommitment(commitment)}
                      className="p-1 text-green-600 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommitment}
                  onChange={(e) => setNewCommitment(e.target.value)}
                  placeholder="Add a sustainability commitment"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCommitment()}
                />
                <button
                  onClick={handleAddCommitment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Carbon Footprint */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Carbon Footprint Reporting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Average Carbon Score</p>
                  <p className="text-3xl font-bold text-green-600">92</p>
                  <p className="text-sm text-gray-500">out of 100</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">CO₂ Saved This Year</p>
                  <p className="text-3xl font-bold text-green-600">1,234</p>
                  <p className="text-sm text-gray-500">metric tons</p>
                </div>
              </div>
              <div className="mt-4">
                <button className="flex items-center gap-2 text-green-600 hover:text-green-700">
                  <FileText className="w-4 h-4" />
                  Download Carbon Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Certification Modal */}
        {showCertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Add Certification</h2>
                  <button
                    onClick={() => setShowCertModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certification Name
                  </label>
                  <input
                    type="text"
                    value={newCert.name || ''}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    placeholder="e.g., ISO 14001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={newCert.issuer || ''}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                    placeholder="e.g., ISO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={newCert.validUntil || ''}
                    onChange={(e) => setNewCert({ ...newCert, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCertification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Certification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
