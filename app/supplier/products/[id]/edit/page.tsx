"use client";

import { useEffect, useState, use } from "react";
import { ProductForm } from "@/components/ProductForm";
import { useRouter } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";

export default function EditProductPage({ params }: { params: { id: string } }) {
  // Use plain object params for Next.js 14 based on user feedback,
  // but if this is a Client Component, params are passed as props directly.
  // However, in Next.js 13+ App Router, page props are async in Server Components,
  // but this is "use client".
  // Wait, in Next.js 14, standard page props are just objects.
  // The 'use' hook is for promises.
  // Let's assume standard object destructuring is fine if it's not a promise.

  const { id } = params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError("Could not load product details");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
        fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center text-red-600">
        <FiAlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">{error || "Product not found"}</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground mt-1">
          Update product details and specifications
        </p>
      </div>

      <ProductForm initialData={product} isEditing={true} />
    </div>
  );
}
