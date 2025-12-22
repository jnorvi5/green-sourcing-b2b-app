"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SustainabilityDataBadge } from "@/components/SustainabilityDataBadge";

export interface MaterialProduct {
  ProductID: string;
  ProductName: string;
  Description: string | null;
  SupplierID: string;
  SupplierName: string;
  ImageURL: string | null;
  GlobalWarmingPotential: number | null;
  UnitPrice: number | null;
  Currency: string | null;
  Certifications: string[];
}

export function MaterialCard({ product }: { product: MaterialProduct }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleAddToRFQ = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      // Redirect to login or show modal
      router.push("/login?redirect=/materials");
      return;
    }
    // TODO: Add to RFQ logic (e.g. open modal or add to cart)
    console.log("Add to RFQ", product.ProductID);
    alert("Added to RFQ (Mock)");
  };

  return (
    <Link href={`/materials/${product.ProductID}`} className="block h-full">
      <Card className="h-full hover:shadow-lg transition-shadow duration-200 flex flex-col overflow-hidden border-slate-800 bg-slate-900 text-slate-100">
        <div className="relative h-48 w-full bg-slate-800">
          {product.ImageURL ? (
            <Image
              src={product.ImageURL}
              alt={product.ProductName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No Image
            </div>
          )}
          {product.GlobalWarmingPotential !== null && (
            <div className="absolute top-2 right-2">
              <SustainabilityDataBadge
                value={product.GlobalWarmingPotential}
                unit="kg CO2e"
                label="GWP"
              />
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="text-sm text-slate-400 mb-1">{product.SupplierName}</div>
          <CardTitle className="text-xl font-bold truncate" title={product.ProductName}>
            {product.ProductName}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow pb-2">
          <p className="text-slate-300 text-sm line-clamp-2 h-10 mb-4">
            {product.Description || "No description available."}
          </p>

          {product.Certifications && product.Certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.Certifications.slice(0, 3).map((cert, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-800"
                >
                  {cert}
                </span>
              ))}
              {product.Certifications.length > 3 && (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                  +{product.Certifications.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <div className="font-semibold text-lg">
            {product.UnitPrice !== null ? (
              `${product.Currency || '$'}${product.UnitPrice.toFixed(2)}`
            ) : (
              <span className="text-sm text-slate-500">Price on request</span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-green-700 text-green-500 hover:bg-green-900/20 hover:text-green-400"
            onClick={handleAddToRFQ}
          >
            Add to RFQ
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
