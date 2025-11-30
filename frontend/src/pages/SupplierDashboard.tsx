import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ProductList from '../components/dashboard/ProductList';
import ProductForm from '../components/dashboard/ProductForm';

const SupplierDashboard: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Assuming user is logged in as supplier
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (productData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      await fetchProducts();
      setView('list');
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete product');

      await fetchProducts();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="mt-1 text-gray-500">Manage your sustainable materials and view verification status.</p>
        </div>
        
        {view === 'list' && (
          <button 
            onClick={() => setView('create')}
            className="btn-primary flex items-center shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5"
          >
            <span className="mr-2">+</span> Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {view === 'list' ? (
        loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ProductList 
            products={products} 
            onEdit={(product) => {
              setSelectedProduct(product);
              setView('edit');
            }}
            onDelete={handleDeleteProduct}
          />
        )
      ) : (
        <ProductForm 
          initialData={view === 'edit' ? selectedProduct : undefined}
          onSubmit={handleCreateProduct}
          onCancel={() => {
            setView('list');
            setSelectedProduct(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default SupplierDashboard;
