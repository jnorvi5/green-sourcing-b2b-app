'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { MaterialType } from '@/types/rfq';

interface Product {
  id: string;
  supplier_id: string;
  product_name: string;
  description: string | null;
  material_type: MaterialType;
  unit_price: number | null;
  certifications: string[];
  image_url: string | null;
  epd_url: string | null;
  carbon_footprint: number | null;
  is_active: boolean;
  created_at: string;
}

interface ProductFormData {
  product_name: string;
  description: string;
  material_type: MaterialType;
  unit_price: string;
  certifications: string;
  epd_url: string;
  carbon_footprint: string;
}

const MATERIAL_TYPES: MaterialType[] = [
  'insulation',
  'flooring',
  'cladding',
  'roofing',
  'structural',
  'glazing',
  'finishes',
  'hvac',
  'plumbing',
  'electrical',
  'other',
];

export default function ProductsManagementPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    product_name: '',
    description: '',
    material_type: 'other',
    unit_price: '',
    certifications: '',
    epd_url: '',
    carbon_footprint: '',
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    try {
      // Check auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push('/auth/login');
        return;
      }
      setUser(authUser);

      // Get supplier ID for this user
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (supplierError || !supplierData) {
        console.error('Error getting supplier:', supplierError);
        router.push('/architect/dashboard');
        return;
      }

      setSupplierId(supplierData.id);

      // Fetch products for this supplier
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setError('Failed to load products');
      } else {
        setProducts(productsData || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      product_name: '',
      description: '',
      material_type: 'other',
      unit_price: '',
      certifications: '',
      epd_url: '',
      carbon_footprint: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || '',
      material_type: product.material_type,
      unit_price: product.unit_price?.toString() || '',
      certifications: product.certifications.join(', '),
      epd_url: product.epd_url || '',
      carbon_footprint: product.carbon_footprint?.toString() || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) return;

    setSubmitting(true);
    setError(null);

    try {
      const certificationsArray = formData.certifications
        .split(',')
        .map((cert) => cert.trim())
        .filter((cert) => cert);

      const productData = {
        supplier_id: supplierId,
        product_name: formData.product_name,
        description: formData.description || null,
        material_type: formData.material_type,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        certifications: certificationsArray,
        epd_url: formData.epd_url || null,
        carbon_footprint: formData.carbon_footprint ? parseFloat(formData.carbon_footprint) : null,
        is_active: true,
      };

      if (editingProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase.from('products').insert(productData);

        if (insertError) throw insertError;
      }

      // Reload products
      await loadProducts();
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);

      if (deleteError) throw deleteError;

      // Reload products
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  async function toggleProductStatus(productId: string, currentStatus: boolean) {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Reload products
      await loadProducts();
    } catch (err) {
      console.error('Error toggling product status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product status');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
          <p className="text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Management</h1>
              <p className="text-gray-400">Manage your sustainable product catalog</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <span>+</span>
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Product Form */}
        {showForm && (
          <div className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product_name" className="block text-sm font-medium mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="product_name"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                    placeholder="e.g., Recycled Steel Beams"
                  />
                </div>

                <div>
                  <label htmlFor="material_type" className="block text-sm font-medium mb-2">
                    Material Type *
                  </label>
                  <select
                    id="material_type"
                    required
                    value={formData.material_type}
                    onChange={(e) =>
                      setFormData({ ...formData, material_type: e.target.value as MaterialType })
                    }
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                  >
                    {MATERIAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="unit_price" className="block text-sm font-medium mb-2">
                    Unit Price (USD)
                  </label>
                  <input
                    type="number"
                    id="unit_price"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="carbon_footprint" className="block text-sm font-medium mb-2">
                    Carbon Footprint (kg CO₂e)
                  </label>
                  <input
                    type="number"
                    id="carbon_footprint"
                    step="0.01"
                    value={formData.carbon_footprint}
                    onChange={(e) =>
                      setFormData({ ...formData, carbon_footprint: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="certifications" className="block text-sm font-medium mb-2">
                  Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                  placeholder="e.g., LEED, FSC, Cradle to Cradle"
                />
              </div>

              <div>
                <label htmlFor="epd_url" className="block text-sm font-medium mb-2">
                  EPD URL
                </label>
                <input
                  type="url"
                  id="epd_url"
                  value={formData.epd_url}
                  onChange={(e) => setFormData({ ...formData, epd_url: e.target.value })}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                  placeholder="https://example.com/epd"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
            <p className="text-gray-400 mb-6">
              Start building your catalog by adding your first sustainable product.
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{product.product_name}</h3>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      {product.material_type}
                    </span>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      product.is_active ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    title={product.is_active ? 'Active' : 'Inactive'}
                  />
                </div>

                {product.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  {product.unit_price && (
                    <div className="flex justify-between text-gray-300">
                      <span>Price:</span>
                      <span className="font-semibold">${product.unit_price.toFixed(2)}</span>
                    </div>
                  )}
                  {product.carbon_footprint && (
                    <div className="flex justify-between text-gray-300">
                      <span>Carbon:</span>
                      <span className="font-semibold">
                        {product.carbon_footprint.toFixed(2)} kg CO₂e
                      </span>
                    </div>
                  )}
                  {product.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
