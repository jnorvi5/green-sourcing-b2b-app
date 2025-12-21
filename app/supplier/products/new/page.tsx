import { ProductForm } from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground mt-1">
          Add details about your sustainable material
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
