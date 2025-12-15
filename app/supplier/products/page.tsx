'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FiPlus,
  FiEdit,
  FiCopy,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filterMaterialType, setFilterMaterialType] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filterMaterialType, filterVerified]);

  async function loadProducts() {
    try {
      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Get supplier ID
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (supplierError || !supplierData) {
        console.error('Error getting supplier:', supplierError);
        setLoading(false);
        return;
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setLoading(false);
        return;
      }

      // Map to Product type
      // TODO: Join with product_analytics table for real metrics
      const mappedProducts: Product[] = (productsData || []).map((p) => ({
        id: p.id,
        supplier_id: p.supplier_id,
        name: p.product_name || p.name || '',
        description: p.description,
        material_type: p.material_type,
        application: p.application,
        certifications: p.certifications,
        sustainability_data: p.sustainability_data,
        specs: p.specs,
        images: p.images,
        epd_url: p.epd_url,
        verified: p.verified || false,
        // TEMP: Mock analytics until product_analytics table is created
        views_count: Math.floor(Math.random() * 100) + 10,
        clicks_count: Math.floor(Math.random() * 50) + 5,
        rfq_count: Math.floor(Math.random() * 10),
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...products];

    if (filterMaterialType !== 'all') {
      filtered = filtered.filter(p => p.material_type === filterMaterialType);
    }

    if (filterVerified === 'verified') {
      filtered = filtered.filter(p => p.verified);
    } else if (filterVerified === 'unverified') {
      filtered = filtered.filter(p => !p.verified);
    }

    setFilteredProducts(filtered);
  }

  function toggleProductSelection(productId: string) {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  }

  function selectAll() {
    setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
  }

  function deselectAll() {
    setSelectedProducts(new Set());
  }

  async function handleBulkDelete() {
    if (selectedProducts.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedProducts));

      if (error) throw error;

      // Reload products
      await loadProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Failed to delete products. Please try again.');
    }
  }

  async function handleDuplicate(productId: string) {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) return;

      // Create duplicate
      const { error } = await supabase
        .from('products')
        .insert({
          supplier_id: supplierData.id,
          product_name: `${product.name} (Copy)`,
          material_type: product.material_type,
          description: product.description,
          application: product.application,
          certifications: product.certifications,
          sustainability_data: product.sustainability_data,
          specs: product.specs,
          images: product.images,
          epd_url: product.epd_url,
          verified: false, // Reset verification for copy
        });

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Failed to duplicate product. Please try again.');
    }
  }

  async function handleDelete(productId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  }

  const materialTypes = Array.from(new Set(products.map(p => p.material_type))).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Product Catalog</h1>
              <p className="text-gray-400">
                Manage your sustainable materials
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/supplier/dashboard">
                <Button variant="outline" className="gap-2">
                  ← Dashboard
                </Button>
              </Link>
              <Link href="/supplier/products/new">
                <Button className="bg-teal-500 hover:bg-teal-400 text-black gap-2">
                  <FiPlus className="w-4 h-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterMaterialType}
              onChange={(e) => setFilterMaterialType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Materials</option>
              {materialTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-teal-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-teal-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
            <div className="text-sm text-teal-400">
              {selectedProducts.size} product(s) selected
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
              >
                Deselect All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-4">
                {products.length === 0
                  ? "No products yet. Add your first sustainable material!"
                  : "No products match your filters."}
              </p>
              {products.length === 0 && (
                <Link href="/supplier/products/new">
                  <Button className="bg-teal-500 hover:bg-teal-400 text-black gap-2">
                    <FiPlus className="w-4 h-4" />
                    Add Your First Product
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:border-teal-500/50 transition cursor-pointer"
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-800">
                    {product.images && product.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-5 h-5 rounded border-2 border-white/50 bg-black/50 checked:bg-teal-500 checked:border-teal-500"
                      />
                    </div>

                    {/* Verification Badge */}
                    {product.verified && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {product.material_type}
                    </p>

                    {/* Certifications */}
                    {product.certifications && product.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.certifications.slice(0, 3).map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs"
                          >
                            {cert}
                          </span>
                        ))}
                        {product.certifications.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 text-xs">
                            +{product.certifications.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Analytics */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <FiEye className="w-3 h-3" />
                        <span>{product.views_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <span>{product.clicks_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{product.rfq_count || 0} RFQs</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/supplier/products/${product.id}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full gap-1">
                          <FiEdit className="w-3 h-3" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(product.id)}
                        className="gap-1"
                      >
                        <FiCopy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product.id)}
                        className="gap-1"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                          onChange={() => {
                            if (selectedProducts.size === filteredProducts.length) {
                              deselectAll();
                            } else {
                              selectAll();
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                        Material Type
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                        Certifications
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                        Views
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-gray-800 flex-shrink-0">
                              {product.images && product.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.rfq_count || 0} RFQ matches
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell">
                          {product.material_type}
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {product.certifications && product.certifications.length > 0 ? (
                              <>
                                {product.certifications.slice(0, 2).map((cert, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs"
                                  >
                                    {cert}
                                  </span>
                                ))}
                                {product.certifications.length > 2 && (
                                  <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 text-xs">
                                    +{product.certifications.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {product.views_count || 0}
                        </td>
                        <td className="py-4 px-4">
                          {product.verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-200">
                              <FiCheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-200">
                              <FiAlertCircle className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Link href={`/supplier/products/${product.id}/edit`}>
                              <Button size="sm" variant="outline">
                                <FiEdit className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicate(product.id)}
                            >
                              <FiCopy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
