"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export interface Category {
  CategoryID: string;
  CategoryName: string;
}

export interface Certification {
  CertificationID: string;
  Name: string;
}

interface MaterialFiltersProps {
  categories: Category[];
  certifications: Certification[];
  initialFilters?: {
    query?: string;
    category?: string;
    minGwp?: string;
    maxGwp?: string;
    minPrice?: string;
    maxPrice?: string;
    certifications?: string[];
  };
}

export function MaterialFilters({ categories, certifications, initialFilters }: MaterialFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialFilters?.query || "");
  const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category || "");
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>(initialFilters?.certifications || []);

  // Slider states (using array for range)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    initialFilters?.minPrice ? parseFloat(initialFilters.minPrice) : 0,
    initialFilters?.maxPrice ? parseFloat(initialFilters.maxPrice) : 1000
  ]);

  const [gwpRange, setGwpRange] = useState<[number, number]>([
    initialFilters?.minGwp ? parseFloat(initialFilters.minGwp) : 0,
    initialFilters?.maxGwp ? parseFloat(initialFilters.maxGwp) : 100
  ]);

  const createQueryString = useCallback(
    (params: Record<string, string | null | string[]>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          newSearchParams.delete(key);
        } else if (Array.isArray(value)) {
          newSearchParams.delete(key);
          value.forEach(v => newSearchParams.append(key, v));
        } else {
          newSearchParams.set(key, value);
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const updateFilters = (updates: Record<string, string | null | string[]>) => {
    const queryString = createQueryString(updates);
    router.push(`/materials?${queryString}`, { scroll: false });
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (initialFilters?.query || "")) {
         updateFilters({ query });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Debounce Price Slider
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = priceRange[0].toString();
      const max = priceRange[1].toString();

      // Only update if changed from initial
      if (min !== (initialFilters?.minPrice || "0") || max !== (initialFilters?.maxPrice || "1000")) {
         updateFilters({ minPrice: min, maxPrice: max });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Debounce GWP Slider
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = gwpRange[0].toString();
      const max = gwpRange[1].toString();

      if (min !== (initialFilters?.minGwp || "0") || max !== (initialFilters?.maxGwp || "100")) {
         updateFilters({ minGwp: min, maxGwp: max });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [gwpRange]);

  const handleCategoryChange = (categoryId: string) => {
    const newValue = selectedCategory === categoryId ? "" : categoryId;
    setSelectedCategory(newValue);
    updateFilters({ category: newValue });
  };

  const handleCertificationChange = (certId: string) => {
    let newCerts;
    if (selectedCertifications.includes(certId)) {
      newCerts = selectedCertifications.filter(id => id !== certId);
    } else {
      newCerts = [...selectedCertifications, certId];
    }
    setSelectedCertifications(newCerts);
    updateFilters({ certifications: newCerts });
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setSelectedCertifications([]);
    setPriceRange([0, 1000]);
    setGwpRange([0, 100]);
    router.push("/materials");
  };

  return (
    <div className="space-y-6 w-full md:w-64 flex-shrink-0">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-slate-100">Search</h3>
        <Input
          type="text"
          placeholder="Search materials..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-none">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-base text-slate-100">Categories</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {categories.map((cat) => (
            <div key={cat.CategoryID} className="flex items-center space-x-3 group cursor-pointer" onClick={() => handleCategoryChange(String(cat.CategoryID))}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategory === String(cat.CategoryID) ? 'bg-green-600 border-green-600' : 'border-slate-600 bg-slate-800 group-hover:border-slate-500'}`}>
                 {selectedCategory === String(cat.CategoryID) && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <span className={`text-sm ${selectedCategory === String(cat.CategoryID) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {cat.CategoryName}
              </span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-slate-500">No categories found.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-none">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-base text-slate-100">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {certifications.map((cert) => {
            const isSelected = selectedCertifications.includes(String(cert.CertificationID));
            return (
              <div key={cert.CertificationID} className="flex items-center space-x-3 group cursor-pointer" onClick={() => handleCertificationChange(String(cert.CertificationID))}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-green-600 border-green-600' : 'border-slate-600 bg-slate-800 group-hover:border-slate-500'}`}>
                  {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {cert.Name}
                </span>
              </div>
            )
          })}
           {certifications.length === 0 && (
            <p className="text-sm text-slate-500">No certifications found.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-none">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-base text-slate-100">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6 space-y-6">
          <Slider
            defaultValue={[0, 1000]}
            value={priceRange}
            max={1000}
            step={10}
            onValueChange={(val) => setPriceRange(val as [number, number])}
            className="py-4"
          />
          <div className="flex justify-between items-center text-sm text-slate-400">
             <div className="bg-slate-800 px-2 py-1 rounded min-w-[3rem] text-center">${priceRange[0]}</div>
             <div className="bg-slate-800 px-2 py-1 rounded min-w-[3rem] text-center">${priceRange[1]}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-none">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-base text-slate-100">Carbon (GWP)</CardTitle>
          <p className="text-xs text-slate-500">kg CO2e per unit</p>
        </CardHeader>
        <CardContent className="px-4 pb-6 space-y-6">
          <Slider
            defaultValue={[0, 100]}
            value={gwpRange}
            max={100}
            step={1}
            onValueChange={(val) => setGwpRange(val as [number, number])}
            className="py-4"
          />
          <div className="flex justify-between items-center text-sm text-slate-400">
             <div className="bg-slate-800 px-2 py-1 rounded min-w-[3rem] text-center">{gwpRange[0]}</div>
             <div className="bg-slate-800 px-2 py-1 rounded min-w-[3rem] text-center">{gwpRange[1]}</div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
        onClick={clearFilters}
      >
        Reset Filters
      </Button>
    </div>
  );
}
