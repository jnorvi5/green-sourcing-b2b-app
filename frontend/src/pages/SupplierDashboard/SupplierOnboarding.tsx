/**
 * Supplier Onboarding Page
 *
 * Multi-step onboarding wizard for new suppliers
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BuildingOfficeIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    CloudArrowUpIcon,
    GlobeAltIcon,
    CubeIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

interface CompanyInfo {
    companyName: string;
    industry: string;
    size: string;
    website: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
}

interface ContactInfo {
    primaryName: string;
    primaryEmail: string;
    primaryPhone: string;
    primaryRole: string;
    billingName: string;
    billingEmail: string;
}

interface Certifications {
    epd: boolean;
    iso14001: boolean;
    iso9001: boolean;
    leed: boolean;
    breeam: boolean;
    cradleToCradle: boolean;
    fsc: boolean;
    greenguard: boolean;
    other: string;
}

interface ProductCategories {
    steel: boolean;
    concrete: boolean;
    glass: boolean;
    insulation: boolean;
    lumber: boolean;
    roofing: boolean;
    flooring: boolean;
    other: string;
}

const STEPS = [
    { id: 'company', title: 'Company Info', icon: BuildingOfficeIcon },
    { id: 'contact', title: 'Contacts', icon: GlobeAltIcon },
    { id: 'products', title: 'Products', icon: CubeIcon },
    { id: 'certifications', title: 'Certifications', icon: ShieldCheckIcon },
    { id: 'documents', title: 'Documents', icon: DocumentTextIcon },
    { id: 'review', title: 'Review', icon: CheckCircleIcon },
];

export function SupplierOnboarding() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
        companyName: '',
        industry: '',
        size: '',
        website: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: 'United States',
        zipCode: '',
    });

    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        primaryName: '',
        primaryEmail: '',
        primaryPhone: '',
        primaryRole: '',
        billingName: '',
        billingEmail: '',
    });

    const [certifications, setCertifications] = useState<Certifications>({
        epd: false,
        iso14001: false,
        iso9001: false,
        leed: false,
        breeam: false,
        cradleToCradle: false,
        fsc: false,
        greenguard: false,
        other: '',
    });

    const [productCategories, setProductCategories] = useState<ProductCategories>({
        steel: false,
        concrete: false,
        glass: false,
        insulation: false,
        lumber: false,
        roofing: false,
        flooring: false,
        other: '',
    });

    const [documents, setDocuments] = useState<File[]>([]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setSubmitting(false);
        navigate('/dashboard/supplier');
    };

    const renderStep = () => {
        switch (STEPS[currentStep].id) {
            case 'company':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Company Name *</label>
                            <input
                                type="text"
                                value={companyInfo.companyName}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                                placeholder="Your company name"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Industry *</label>
                                <select
                                    value={companyInfo.industry}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select industry</option>
                                    <option value="steel">Steel & Metals</option>
                                    <option value="concrete">Concrete & Cement</option>
                                    <option value="glass">Glass & Glazing</option>
                                    <option value="insulation">Insulation</option>
                                    <option value="lumber">Lumber & Wood</option>
                                    <option value="general">General Building Materials</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Company Size *</label>
                                <select
                                    value={companyInfo.size}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="500+">500+ employees</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Website</label>
                            <input
                                type="url"
                                value={companyInfo.website}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                                placeholder="https://your-company.com"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Company Description *</label>
                            <textarea
                                value={companyInfo.description}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                                placeholder="Tell us about your company and the sustainable products you offer..."
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Street Address *</label>
                                <input
                                    type="text"
                                    value={companyInfo.address}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">City *</label>
                                <input
                                    type="text"
                                    value={companyInfo.city}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">State/Province *</label>
                                <input
                                    type="text"
                                    value={companyInfo.state}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Country *</label>
                                <select
                                    value={companyInfo.country}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="United States">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Mexico">Mexico</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Germany">Germany</option>
                                    <option value="France">France</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">ZIP/Postal Code *</label>
                                <input
                                    type="text"
                                    value={companyInfo.zipCode}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, zipCode: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div className="space-y-8">
                        <div>
                            <h3 className="font-medium mb-4">Primary Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        value={contactInfo.primaryName}
                                        onChange={(e) => setContactInfo({ ...contactInfo, primaryName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Role/Title *</label>
                                    <input
                                        type="text"
                                        value={contactInfo.primaryRole}
                                        onChange={(e) => setContactInfo({ ...contactInfo, primaryRole: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={contactInfo.primaryEmail}
                                        onChange={(e) => setContactInfo({ ...contactInfo, primaryEmail: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        value={contactInfo.primaryPhone}
                                        onChange={(e) => setContactInfo({ ...contactInfo, primaryPhone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-4">Billing Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={contactInfo.billingName}
                                        onChange={(e) => setContactInfo({ ...contactInfo, billingName: e.target.value })}
                                        placeholder="Same as primary if blank"
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={contactInfo.billingEmail}
                                        onChange={(e) => setContactInfo({ ...contactInfo, billingEmail: e.target.value })}
                                        placeholder="Same as primary if blank"
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'products':
                return (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Select the product categories you supply. You can add specific products after completing onboarding.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: 'steel', label: 'Steel & Metals' },
                                { key: 'concrete', label: 'Concrete & Cement' },
                                { key: 'glass', label: 'Glass & Glazing' },
                                { key: 'insulation', label: 'Insulation' },
                                { key: 'lumber', label: 'Lumber & Wood' },
                                { key: 'roofing', label: 'Roofing' },
                                { key: 'flooring', label: 'Flooring' },
                            ].map((category) => (
                                <label
                                    key={category.key}
                                    className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors ${productCategories[category.key as keyof ProductCategories]
                                            ? 'bg-emerald-900/20 border-emerald-500'
                                            : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={productCategories[category.key as keyof ProductCategories] as boolean}
                                        onChange={(e) =>
                                            setProductCategories({
                                                ...productCategories,
                                                [category.key]: e.target.checked,
                                            })
                                        }
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-medium">{category.label}</span>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Other Categories</label>
                            <input
                                type="text"
                                value={productCategories.other}
                                onChange={(e) => setProductCategories({ ...productCategories, other: e.target.value })}
                                placeholder="List any other product categories you supply"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                );

            case 'certifications':
                return (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Select the certifications your company or products hold. These will be displayed on your profile.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { key: 'epd', label: 'Environmental Product Declaration (EPD)' },
                                { key: 'iso14001', label: 'ISO 14001' },
                                { key: 'iso9001', label: 'ISO 9001' },
                                { key: 'leed', label: 'LEED Certified' },
                                { key: 'breeam', label: 'BREEAM' },
                                { key: 'cradleToCradle', label: 'Cradle to Cradle' },
                                { key: 'fsc', label: 'FSC Certified' },
                                { key: 'greenguard', label: 'GREENGUARD' },
                            ].map((cert) => (
                                <label
                                    key={cert.key}
                                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${certifications[cert.key as keyof Certifications]
                                            ? 'bg-emerald-900/20 border-emerald-500'
                                            : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={certifications[cert.key as keyof Certifications] as boolean}
                                        onChange={(e) =>
                                            setCertifications({
                                                ...certifications,
                                                [cert.key]: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm">{cert.label}</span>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Other Certifications</label>
                            <input
                                type="text"
                                value={certifications.other}
                                onChange={(e) => setCertifications({ ...certifications, other: e.target.value })}
                                placeholder="List any other certifications"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                );

            case 'documents':
                return (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Upload relevant documents to verify your certifications and company information.
                            Accepted formats: PDF, PNG, JPG (max 10MB each).
                        </p>

                        <div
                            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-gray-600 transition-colors cursor-pointer"
                            onDrop={(e) => {
                                e.preventDefault();
                                const files = Array.from(e.dataTransfer.files);
                                setDocuments((prev) => [...prev, ...files]);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <CloudArrowUpIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-300 mb-2">Drag and drop files here</p>
                            <p className="text-sm text-gray-500 mb-4">or</p>
                            <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer transition-colors">
                                Browse Files
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setDocuments((prev) => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                    className="sr-only"
                                />
                            </label>
                        </div>

                        {documents.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Uploaded Documents</h4>
                                {documents.map((file, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                                            <span className="text-sm">{file.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                            <h4 className="font-medium text-blue-400 mb-2">Recommended Documents</h4>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• EPD certificates (if applicable)</li>
                                <li>• ISO certification documents</li>
                                <li>• Business license</li>
                                <li>• Insurance certificate</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'review':
                return (
                    <div className="space-y-6">
                        <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-6 text-center">
                            <SparklesIcon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Almost There!</h3>
                            <p className="text-gray-400">
                                Review your information below and submit to complete your supplier onboarding.
                            </p>
                        </div>

                        {/* Company Summary */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <BuildingOfficeIcon className="w-5 h-5 text-emerald-400" />
                                Company Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Company:</span>
                                    <p>{companyInfo.companyName || 'Not provided'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Industry:</span>
                                    <p>{companyInfo.industry || 'Not provided'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Size:</span>
                                    <p>{companyInfo.size || 'Not provided'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Location:</span>
                                    <p>
                                        {companyInfo.city && companyInfo.state
                                            ? `${companyInfo.city}, ${companyInfo.state}`
                                            : 'Not provided'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Summary */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
                                Contact Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Primary Contact:</span>
                                    <p>{contactInfo.primaryName || 'Not provided'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Email:</span>
                                    <p>{contactInfo.primaryEmail || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Categories Summary */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <CubeIcon className="w-5 h-5 text-emerald-400" />
                                Product Categories
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(productCategories)
                                    .filter(([key, value]) => value === true)
                                    .map(([key]) => (
                                        <span
                                            key={key}
                                            className="px-3 py-1 bg-gray-700 rounded-full text-sm capitalize"
                                        >
                                            {key}
                                        </span>
                                    ))}
                                {Object.values(productCategories).every((v) => v === false || v === '') && (
                                    <span className="text-gray-500">None selected</span>
                                )}
                            </div>
                        </div>

                        {/* Certifications Summary */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                                Certifications
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(certifications)
                                    .filter(([key, value]) => value === true)
                                    .map(([key]) => (
                                        <span
                                            key={key}
                                            className="px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-sm"
                                        >
                                            {key.toUpperCase()}
                                        </span>
                                    ))}
                                {Object.values(certifications).every((v) => v === false || v === '') && (
                                    <span className="text-gray-500">None selected</span>
                                )}
                            </div>
                        </div>

                        {/* Documents Summary */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-emerald-400" />
                                Documents
                            </h4>
                            {documents.length > 0 ? (
                                <p className="text-gray-300">{documents.length} document(s) uploaded</p>
                            ) : (
                                <p className="text-gray-500">No documents uploaded</p>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold">Supplier Onboarding</h1>
                    <p className="text-gray-400">Complete your profile to start selling on GreenChainz</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full ${index < currentStep
                                        ? 'bg-emerald-600'
                                        : index === currentStep
                                            ? 'bg-emerald-600'
                                            : 'bg-gray-700'
                                    }`}
                            >
                                {index < currentStep ? (
                                    <CheckCircleIcon className="w-6 h-6 text-white" />
                                ) : (
                                    <step.icon className="w-5 h-5 text-white" />
                                )}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`w-16 md:w-24 h-1 mx-2 ${index < currentStep ? 'bg-emerald-600' : 'bg-gray-700'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Title */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold">{STEPS[currentStep].title}</h2>
                    <p className="text-gray-400 text-sm">
                        Step {currentStep + 1} of {STEPS.length}
                    </p>
                </div>

                {/* Step Content */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back
                    </button>

                    {currentStep === STEPS.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Complete Setup
                                    <CheckCircleIcon className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                        >
                            Next
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SupplierOnboarding;
