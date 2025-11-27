// frontend/src/pages/SupplierProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReviewsSection from '../components/Reviews/ReviewsSection';
import { fetchSupplier, MongoSupplier, formatLocation, formatRating } from '../lib/suppliers-api';
import { fetchProducts, MongoProduct, toFrontendProduct } from '../lib/products-api';
import { useIntercomTracking } from '../hooks/useIntercomTracking';
import {
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  StarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Loading skeleton
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative">
        <div className="flex items-end gap-6 mb-8">
          <div className="w-32 h-32 bg-muted rounded-xl border-4 border-background" />
          <div className="pb-4 space-y-2">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="h-4 bg-muted rounded w-40" />
          </div>
        </div>
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// Product card component
function ProductCard({ product }: { product: MongoProduct }) {
  const displayProduct = toFrontendProduct(product);

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {displayProduct.sustainabilityScore && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 text-white text-xs font-medium rounded">
            🌱 {displayProduct.sustainabilityScore}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-primary">
            {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '$'}
            {product.price?.toLocaleString() || 'Contact'}
          </span>
          {product.greenData?.recycledContent && (
            <span className="text-xs text-muted-foreground">
              {product.greenData.recycledContent}% recycled
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function SupplierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { trackSupplierContact } = useIntercomTracking();

  const [supplier, setSupplier] = useState<MongoSupplier | null>(null);
  const [products, setProducts] = useState<MongoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (!id) {
      setError('Supplier ID is required');
      setLoading(false);
      return;
    }

    async function loadSupplier() {
      setLoading(true);
      setError(null);

      // Fetch supplier
      const supplierRes = await fetchSupplier(id!, true);

      if (!supplierRes.success || !supplierRes.data._id) {
        setError(supplierRes.error || 'Supplier not found');
        setLoading(false);
        return;
      }

      setSupplier(supplierRes.data);

      // If products weren't included, fetch them separately
      if (supplierRes.products) {
        setProducts(supplierRes.products as MongoProduct[]);
      } else {
        const productsRes = await fetchProducts({ supplierId: id, status: 'active', limit: 20 });
        if (productsRes.success) {
          setProducts(productsRes.data);
        }
      }

      setLoading(false);
    }

    loadSupplier();
  }, [id]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Supplier Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The supplier you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Browse Suppliers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5 relative">
        {supplier.coverImage && (
          <img
            src={supplier.coverImage}
            alt={`${supplier.companyName} cover`}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Logo */}
            <div className="w-28 h-28 md:w-32 md:h-32 bg-card rounded-xl border-4 border-background shadow-lg flex items-center justify-center overflow-hidden">
              {supplier.logo ? (
                <img src={supplier.logo} alt={supplier.companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {supplier.companyName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{supplier.companyName}</h1>
                {supplier.verified && (
                  <CheckBadgeIcon className="w-6 h-6 text-primary" title="Verified Supplier" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {formatLocation(supplier.location)}
                </span>
                {supplier.rating.count > 0 && (
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    {formatRating(supplier.rating)}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Button */}
            <div className="flex gap-2">
              <a
                href={`mailto:${supplier.email}`}
                onClick={() => trackSupplierContact(supplier._id, supplier.name, 'email')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Stats & Info Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-card border border-border rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">{supplier.metrics.totalProducts}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg text-center">
            <p className="text-2xl font-bold text-foreground">{supplier.metrics.responseRate}%</p>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg text-center">
            <p className="text-2xl font-bold text-foreground">
              {supplier.metrics.avgResponseTime > 0 ? `${supplier.metrics.avgResponseTime}h` : 'Fast'}
            </p>
            <p className="text-sm text-muted-foreground">Avg Response</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">{supplier.sustainabilityScore || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Sustainability Score</p>
          </div>
        </div>

        {/* Description & Contact Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
            <p className="text-foreground leading-relaxed">
              {supplier.description || 'No description provided.'}
            </p>

            {/* Certifications */}
            {supplier.certifications.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {supplier.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full text-sm"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {supplier.categories.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Product Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {supplier.categories.map((cat, idx) => (
                    <Link
                      key={idx}
                      to={`/search?category=${encodeURIComponent(cat)}&supplier=${id}`}
                      className="px-3 py-1 bg-muted text-foreground rounded-full text-sm hover:bg-muted/80 transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Sidebar */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
            <div className="space-y-3">
              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5" />
                  <span className="truncate">{supplier.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {supplier.phone && (
                <a
                  href={`tel:${supplier.phone}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>{supplier.phone}</span>
                </a>
              )}
              <a
                href={`mailto:${supplier.email}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5" />
                <span className="truncate">{supplier.email}</span>
              </a>
              {supplier.location.address && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPinIcon className="w-5 h-5 mt-0.5" />
                  <span>{supplier.location.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border flex gap-8 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === 'products'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === 'reviews'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Reviews ({supplier.rating.count})
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <div className="text-center py-12 bg-muted rounded-lg">
                  <h3 className="text-xl font-semibold text-foreground">No Products Listed</h3>
                  <p className="text-muted-foreground mt-2">
                    This supplier hasn't added any products yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection
              itemId={supplier._id}
              itemType="supplier"
              itemName={supplier.companyName}
            />
          )}
        </div>
      </div>
    </div>
  );
}



