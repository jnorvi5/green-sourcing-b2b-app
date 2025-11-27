import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRightIcon, DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ReviewsSection from '../components/Reviews/ReviewsSection';
import SEO from '../components/SEO';
import AutodeskViewer from '../components/AutodeskViewer';
import { fetchProduct, MongoProduct } from '../lib/products-api';

// Skeleton component for loading state
function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-lg" />
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-40" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
          <div className="grid grid-cols-2 gap-4 p-6 bg-muted rounded-lg">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-background/50 rounded w-20" />
                <div className="h-8 bg-background/50 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = params.id;

  // Product state from MongoDB API
  const [product, setProduct] = useState<MongoProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autodeskCarbon, setAutodeskCarbon] = useState<{
    id: string;
    gwp: number;
    source: string;
    last_updated: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [currentImage, setCurrentImage] = useState(0);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isRFQSubmitted, setRFQSubmitted] = useState(false);
  const [rfqLoading, setRfqLoading] = useState(false);
  const [rfqForm, setRfqForm] = useState({
    email: '',
    companyName: '',
    projectDetails: '',
    quantity: ''
  });

  // Fetch product from MongoDB API
  useEffect(() => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    async function loadProduct() {
      setLoading(true);
      setError(null);
      
      const response = await fetchProduct(productId!, true);
      
      if (!response.success || !response.data._id) {
        setError(response.error || 'Product not found');
        setLoading(false);
        return;
      }

      setProduct(response.data);
      if (response.autodeskCarbon) {
        setAutodeskCarbon(response.autodeskCarbon);
      }
      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  // Submit RFQ to API
  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setRfqLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('greenchainz-token');
      
      const response = await fetch(`${API_BASE}/api/rfq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          productId: product._id,
          supplierId: product.supplierId,
          buyerEmail: rfqForm.email,
          buyerCompany: rfqForm.companyName,
          message: rfqForm.projectDetails,
          quantity: parseInt(rfqForm.quantity) || 1,
          status: 'pending'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit RFQ');
      }

      setShowQuoteModal(false);
      setRFQSubmitted(true);
      setRfqForm({ email: '', companyName: '', projectDetails: '', quantity: '' });
    } catch (err) {
      console.error('RFQ submission error:', err);
      alert('Failed to submit quote request. Please try again.');
    } finally {
      setRfqLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-muted border-b border-border py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-4 bg-muted-foreground/20 rounded w-48" />
          </div>
        </div>
        <ProductSkeleton />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Go Back
            </button>
            <Link
              to="/search"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare display data from MongoDB product
  const displayProduct = {
    id: product._id,
    name: product.title,
    description: product.description,
    images: product.images?.length ? product.images : ['https://placehold.co/800x600/1a1a1a/10b981?text=No+Image'],
    company: {
      id: product.supplierId,
      name: product.supplierName || 'Unknown Supplier',
      location: 'Contact supplier for details'
    },
    specs: {
      materialType: product.category,
      subcategory: product.subcategory,
      recycledContent: product.greenData?.recycledContent || 0,
      minOrderQuantity: product.minOrderQuantity,
      unitOfMeasure: product.unitOfMeasure,
      leadTimeDays: product.leadTimeDays
    },
    certifications: (product.greenData?.certifications || product.certificates || []).map(cert => ({
      name: cert,
      logo: `/certs/${cert.toLowerCase().replace(/\\s+/g, '-')}.png`
    })),
    epd: {
      url: product.greenData?.epdId ? `/epds/${product.greenData.epdId}.pdf` : null,
      gwp: autodeskCarbon?.gwp || product.greenData?.carbonFootprint || 0,
      recycledContent: product.greenData?.recycledContent || 0
    },
    pricing: {
      price: product.price,
      currency: product.currency
    },
    sustainabilityScore: product.sustainabilityScore
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${displayProduct.name} | ${displayProduct.company.name}`}
        description={displayProduct.description}
        image={displayProduct.images[0]}
        type="product"
      />
      {/* Breadcrumbs */}
      <div className="bg-muted border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link to="/search" className="hover:text-primary">Products</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link to={`/search?category=${displayProduct.specs.materialType}`} className="hover:text-primary">
              {displayProduct.specs.materialType}
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-foreground truncate max-w-xs">{displayProduct.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: 3D Viewer or Image Gallery */}
          <div>
            {/* 3D Viewer - shows Ghost Mode if no URN */}
            <AutodeskViewer urn="" />

            {/* Thumbnails - shown below viewer as supplementary images */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {displayProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentImage === idx ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${displayProduct.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/1a1a1a/10b981?text=Image';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{displayProduct.name}</h1>
              {displayProduct.sustainabilityScore && (
                <div className="flex-shrink-0 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                  🌱 Score: {displayProduct.sustainabilityScore}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <span className="text-2xl font-bold text-primary">
                {displayProduct.pricing.currency === 'USD' ? '$' : displayProduct.pricing.currency === 'EUR' ? '€' : displayProduct.pricing.currency === 'GBP' ? '£' : '$'}
                {displayProduct.pricing.price?.toLocaleString() || 'Contact for pricing'}
              </span>
              {displayProduct.specs.unitOfMeasure && (
                <span className="text-muted-foreground ml-2">/ {displayProduct.specs.unitOfMeasure}</span>
              )}
            </div>

            {/* Supplier Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {displayProduct.company.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <Link to={`/supplier/${displayProduct.company.id}`} className="text-lg font-semibold text-primary hover:underline">
                  {displayProduct.company.name}
                </Link>
                <p className="text-sm text-muted-foreground">{displayProduct.company.location}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-foreground leading-relaxed mb-6">
              {displayProduct.description}
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recycled Content</p>
                <p className="text-2xl font-bold text-primary">{displayProduct.specs.recycledContent}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Carbon Footprint</p>
                <p className="text-2xl font-bold text-primary">
                  {displayProduct.epd.gwp > 0 ? `${displayProduct.epd.gwp.toFixed(1)} kg CO₂e` : 'N/A'}
                </p>
                {autodeskCarbon && (
                  <p className="text-xs text-muted-foreground">via Autodesk API</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Min Order</p>
                <p className="text-2xl font-bold text-foreground">
                  {displayProduct.specs.minOrderQuantity || 1} {displayProduct.specs.unitOfMeasure || 'units'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lead Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {displayProduct.specs.leadTimeDays ? `${displayProduct.specs.leadTimeDays} days` : 'Contact'}
                </p>
              </div>
            </div>

            {/* Certifications */}
            {displayProduct.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-3">
                  {displayProduct.certifications.map((cert, idx) => (
                    <div key={idx} className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-md">
                      <span className="text-sm font-medium text-primary">{cert.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {isRFQSubmitted && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-semibold">✅ RFQ Sent!</p>
                <p className="text-green-700 dark:text-green-300 text-sm">Your quote request has been sent. {displayProduct.company.name} will respond within 48 hours.</p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowQuoteModal(true)}
                className="flex-1 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
              >
                Request Quote
              </button>
              <button className="px-8 py-4 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors">
                Save to Project
              </button>
            </div>

            {/* EPD Download */}
            {displayProduct.epd.url && (
              <a
                href={displayProduct.epd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center gap-2 text-primary hover:underline"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Download Environmental Product Declaration (EPD)
              </a>
            )}
        {/* Tabs Section */}
        <div className="mt-12">
          {/* Tab Headers */}
          <div className="border-b border-border flex gap-8 overflow-x-auto">
            {['overview', 'specs', 'certifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'overview' ? 'Overview' :
                 tab === 'specs' ? 'Technical Specifications' :
                 tab === 'certifications' ? 'Sustainability Data' : 'Reviews'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Product Overview</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  {displayProduct.description}
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                    {displayProduct.specs.materialType}
                  </span>
                  {displayProduct.specs.subcategory && (
                    <span className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                      {displayProduct.specs.subcategory}
                    </span>
                  )}
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-foreground mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Technical Specifications</h2>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 font-medium text-foreground">Category</td>
                      <td className="py-3 text-muted-foreground">{product.category}</td>
                    </tr>
                    {product.subcategory && (
                      <tr className="border-b border-border">
                        <td className="py-3 font-medium text-foreground">Subcategory</td>
                        <td className="py-3 text-muted-foreground">{product.subcategory}</td>
                      </tr>
                    )}
                    <tr className="border-b border-border">
                      <td className="py-3 font-medium text-foreground">Unit of Measure</td>
                      <td className="py-3 text-muted-foreground">{product.unitOfMeasure || 'Each'}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 font-medium text-foreground">Minimum Order Quantity</td>
                      <td className="py-3 text-muted-foreground">{product.minOrderQuantity || 1}</td>
                    </tr>
                    {product.leadTimeDays && (
                      <tr className="border-b border-border">
                        <td className="py-3 font-medium text-foreground">Lead Time</td>
                        <td className="py-3 text-muted-foreground">{product.leadTimeDays} days</td>
                      </tr>
                    )}
                    {product.greenData?.recycledContent !== undefined && (
                      <tr className="border-b border-border">
                        <td className="py-3 font-medium text-foreground">Recycled Content</td>
                        <td className="py-3 text-muted-foreground">{product.greenData.recycledContent}%</td>
                      </tr>
                    )}
                    {product.greenData?.renewableEnergy !== undefined && (
                      <tr className="border-b border-border">
                        <td className="py-3 font-medium text-foreground">Renewable Energy Used</td>
                        <td className="py-3 text-muted-foreground">{product.greenData.renewableEnergy}%</td>
                      </tr>
                    )}
                    {product.greenData?.waterUsage !== undefined && (
                      <tr className="border-b border-border">
                        <td className="py-3 font-medium text-foreground">Water Usage</td>
                        <td className="py-3 text-muted-foreground">{product.greenData.waterUsage} L/unit</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'certifications' && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Sustainability Certifications & Data</h2>
                <div className="space-y-6">
                  {displayProduct.certifications.length > 0 ? (
                    displayProduct.certifications.map((cert, idx) => (
                      <div key={idx} className="p-6 border border-border rounded-lg">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">Verified certification</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No certifications listed for this product.</p>
                  )}
                  <div className="p-6 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Environmental Impact Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Global Warming Potential</p>
                        <p className="text-xl font-bold text-primary">
                          {displayProduct.epd.gwp > 0 ? `${displayProduct.epd.gwp.toFixed(2)} kg CO₂e` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recycled Content</p>
                        <p className="text-xl font-bold text-primary">{displayProduct.epd.recycledContent}%</p>
                      </div>
                      {product.greenData?.renewableEnergy !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">Renewable Energy</p>
                          <p className="text-xl font-bold text-primary">{product.greenData.renewableEnergy}%</p>
                        </div>
                      )}
                    </div>
                    {autodeskCarbon && (
                      <p className="text-sm text-muted-foreground mt-4 italic">
                        Carbon data enriched via Autodesk Platform Services • Updated: {new Date(autodeskCarbon.last_updated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewsSection itemId={product._id} itemType="product" itemName={displayProduct.name} />
            )}
          </div>
        </div>
      </div>

      {/* Request Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-4">Request Quote</h2>
            <p className="text-muted-foreground mb-6">Product: {displayProduct.name}</p>
            <form onSubmit={handleRequestQuote} className="space-y-4">
              <input
                type="email"
                placeholder="Your Email"
                required
                value={rfqForm.email}
                onChange={(e) => setRfqForm({ ...rfqForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
              <input
                type="text"
                placeholder="Company Name"
                required
                value={rfqForm.companyName}
                onChange={(e) => setRfqForm({ ...rfqForm, companyName: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
              <input
                type="number"
                placeholder="Quantity Needed"
                min="1"
                required
                value={rfqForm.quantity}
                onChange={(e) => setRfqForm({ ...rfqForm, quantity: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
              <textarea
                placeholder="Project Details & Special Requirements"
                rows={4}
                required
                value={rfqForm.projectDetails}
                onChange={(e) => setRfqForm({ ...rfqForm, projectDetails: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  disabled={rfqLoading}
                  className="flex-1 px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rfqLoading}
                  className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {rfqLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send RFQ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
