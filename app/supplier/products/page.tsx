"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FiPlus, FiEdit, FiTrash2, FiBox } from "react-icons/fi";
import { useRouter } from "next/navigation";

// Use the type from the API
interface Product {
  id: string;
  product_name: string;
  material_type: string;
  price_per_unit?: number;
  unit_type?: string;
  images?: string[];
  status?: string;
  created_at?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog
          </p>
        </div>
        <Link href="/supplier/products/new">
          <Button className="gap-2">
            <FiPlus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FiBox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No products yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start building your catalog by adding your first product.
            </p>
            <Link href="/supplier/products/new">
              <Button>Add Your First Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="aspect-video relative bg-muted">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.product_name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <FiBox className="w-12 h-12" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold truncate pr-4" title={product.product_name}>
                    {product.product_name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                    {product.material_type}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>
                    {product.price_per_unit
                      ? `$${product.price_per_unit} / ${product.unit_type}`
                      : "Price on request"}
                  </span>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Link href={`/supplier/products/${product.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <FiEdit className="w-4 h-4" /> Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(product.id)}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
